import mongoose from 'mongoose';
import type { CompanyRepository } from '../repositories/company.repository.js';
import type { WebsiteAnalysisRepository } from '../repositories/websiteAnalysis.repository.js';
import { NotFoundError } from '../utils/errors.js';
import type { IWebsiteAnalysisDocument } from '../models/WebsiteAnalysis.js';
import type { ScraperProvider, ScrapeErrorCode } from './providers/scraperProvider.js';
import { NON_RETRYABLE_ERROR_CODES } from './providers/scraperProvider.js';
import { logger } from '../utils/logger.js';

export type WebsiteAnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export class WebsiteAnalysisService {
  constructor(
    private readonly websiteAnalysisRepository: WebsiteAnalysisRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly scraperProvider: ScraperProvider,
  ) {}

  /**
   * Normalizes a raw website value into a fully-qualified URL.
   *
   * Rules:
   *  - Already has http:// or https:// → returned as-is
   *  - localhost / 127.x.x.x / 0.0.0.0 → prepend http://
   *  - Everything else (e.g. "openai.com", "www.example.com") → prepend https://
   *  - Empty string → returned as-is (caller must handle)
   */
  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return '';

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (
      /^localhost/i.test(trimmed) ||
      /^127(?:\.\d{1,3}){3}/.test(trimmed) ||
      /^0\.0\.0\.0/.test(trimmed)
    ) {
      return `http://${trimmed}`;
    }

    return `https://${trimmed}`;
  }

  /**
   * Returns true if the error code represents a transient failure worth retrying.
   *
   * Non-retryable codes indicate permanent problems (bad domain, access denied, etc.)
   * that will not be resolved by retrying the same request.
   */
  private isRetryable(errorCode: ScrapeErrorCode | undefined): boolean {
    if (!errorCode) return true; // unknown errors are optimistically retried
    return !NON_RETRYABLE_ERROR_CODES.has(errorCode);
  }

  async analyzeCompany(ownerId: string, companyId: string): Promise<IWebsiteAnalysisDocument> {
    logger.info('[WebsiteAnalysis] Analysis started', { ownerId, companyId });

    const company = await this.companyRepository.findByIdAndOwner(companyId, ownerId);
    if (!company) {
      logger.error('[WebsiteAnalysis] Analysis failed: company not found', { ownerId, companyId });
      throw new NotFoundError('Company');
    }

    // ── Step 1: Normalize URL once, at the service layer ──────────────────────
    const rawUrl = company.website ?? '';
    const normalizedUrl = this.normalizeUrl(rawUrl);

    logger.info('[WebsiteAnalysis] Normalized URL', { companyId, rawUrl, normalizedUrl });

    if (!normalizedUrl) {
      logger.error('[WebsiteAnalysis] Company has no website configured', { companyId });
      await this.companyRepository.updateById(companyId, { $set: { analysisStatus: 'FAILED' } });
      throw new Error(
        'Company has no website URL configured. Please add a website before analyzing.',
      );
    }

    // ── Step 2: Create or reuse WebsiteAnalysis document ──────────────────────
    const existing = await this.websiteAnalysisRepository.findByCompany(companyId);
    const analysisDoc =
      existing ??
      (await this.websiteAnalysisRepository.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        url: normalizedUrl,
        status: 'PENDING' as WebsiteAnalysisStatus,
        retryCount: 0,
      } as Parameters<WebsiteAnalysisRepository['create']>[0]));

    logger.info('[WebsiteAnalysis] MongoDB document ready', {
      companyId,
      websiteAnalysisId: String(analysisDoc._id),
      url: normalizedUrl,
      isNewDocument: !existing,
      previousRetryCount: analysisDoc.retryCount,
    });

    // Compute retry count once — shared by the PROCESSING update and the failure handler.
    const nextRetryCount = (analysisDoc.retryCount ?? 0) + 1;

    await this.companyRepository.updateById(companyId, { $set: { analysisStatus: 'PROCESSING' } });
    await this.websiteAnalysisRepository.updateById(String(analysisDoc._id), {
      $set: {
        status: 'PROCESSING',
        url: normalizedUrl,        // always persist the normalized URL
        retryCount: nextRetryCount,
        error: undefined,          // clear any previous error
        errorCode: undefined,
      },
    });

    // ── Step 3: Scrape ─────────────────────────────────────────────────────────
    logger.info('[WebsiteAnalysis] Calling FirecrawlProvider', {
      companyId,
      url: normalizedUrl,
    });

    let result: Awaited<ReturnType<ScraperProvider['scrape']>>;
    try {
      result = await this.scraperProvider.scrape(normalizedUrl, 30_000);
    } catch (unexpectedError) {
      // The provider should never throw — it always returns a ScrapeResult.
      // This catch is a safety net for truly unexpected runtime errors.
      result = {
        status: 'FAILED',
        errorCode: 'UNKNOWN',
        error:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : 'Unexpected error in scraper',
      };
    }

    logger.info('[WebsiteAnalysis] Scraper response received', {
      companyId,
      url: normalizedUrl,
      status: result.status,
      errorCode: result.errorCode ?? null,
      hasTitle: !!result.title,
      hasDescription: !!result.description,
      contentLength: result.content?.length ?? 0,
    });

    // ── Step 4: Handle FAILED result inline (no throw) ─────────────────────────
    if (result.status === 'FAILED') {
      const retryable = this.isRetryable(result.errorCode);
      const shouldRetry = retryable && nextRetryCount <= 3;
      const nextStatus = shouldRetry ? 'PENDING' : 'FAILED';

      const updated = await this.websiteAnalysisRepository.updateById(String(analysisDoc._id), {
        $set: {
          status: nextStatus,
          retryCount: nextRetryCount,
          error: result.error,
          errorCode: result.errorCode,
        },
      });

      await this.companyRepository.updateById(companyId, {
        $set: { analysisStatus: nextStatus },
      });

      logger.error('[WebsiteAnalysis] Analysis failed', {
        companyId,
        websiteAnalysisId: String(analysisDoc._id),
        url: normalizedUrl,
        errorCode: result.errorCode,
        error: result.error,
        retryCount: nextRetryCount,
        retryable,
        shouldRetry,
        nextStatus,
      });

      return updated ?? analysisDoc;
    }

    // ── Step 5: Persist COMPLETED results ─────────────────────────────────────
    const updated = await this.websiteAnalysisRepository.updateById(String(analysisDoc._id), {
      $set: {
        title: result.title,
        description: result.description,
        content: result.content,
        scrapedAt: new Date(),
        status: 'COMPLETED',
        error: undefined,
        errorCode: undefined,
      },
    });

    await this.companyRepository.updateById(companyId, {
      $set: { analysisStatus: 'COMPLETED', lastAnalyzedAt: new Date() },
    });

    logger.info('[WebsiteAnalysis] Analysis completed', {
      companyId,
      websiteAnalysisId: String(analysisDoc._id),
      url: normalizedUrl,
      title: result.title,
      descriptionLength: result.description?.length ?? 0,
      contentLength: result.content?.length ?? 0,
    });

    return updated ?? analysisDoc;
  }

  async getByCompany(
    ownerId: string,
    companyId: string,
  ): Promise<IWebsiteAnalysisDocument | null> {
    const company = await this.companyRepository.findByIdAndOwner(companyId, ownerId);
    if (!company) {
      throw new NotFoundError('Company');
    }
    return this.websiteAnalysisRepository.findByCompany(companyId);
  }
}
