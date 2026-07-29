import mongoose from 'mongoose';
import type { CompanyRepository } from '../repositories/company.repository.js';
import type { WebsiteAnalysisRepository } from '../repositories/websiteAnalysis.repository.js';
import { NotFoundError } from '../utils/errors.js';
import type { IWebsiteAnalysisDocument } from '../models/WebsiteAnalysis.js';
import type { ScraperProvider } from './providers/scraperProvider.js';
import { logger } from '../utils/logger.js';

export type WebsiteAnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export class WebsiteAnalysisService {
  constructor(
    private readonly websiteAnalysisRepository: WebsiteAnalysisRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly scraperProvider: ScraperProvider,
  ) {}

  async analyzeCompany(ownerId: string, companyId: string): Promise<IWebsiteAnalysisDocument> {
    logger.info('Analysis started', { ownerId, companyId });

    const company = await this.companyRepository.findByIdAndOwner(companyId, ownerId);
    if (!company) {
      logger.error('Analysis failed: company not found', { ownerId, companyId });
      throw new NotFoundError('Company');
    }

    const existing = await this.websiteAnalysisRepository.findByCompany(companyId);
    const analysisDoc = existing ?? (await this.websiteAnalysisRepository.create({
      companyId: new mongoose.Types.ObjectId(companyId),
      url: company.website ?? '',
      status: 'PENDING' as WebsiteAnalysisStatus,
      retryCount: 0,
    } as Parameters<WebsiteAnalysisRepository['create']>[0]));

    logger.info('MongoDB save', {
      companyId,
      websiteAnalysisId: String(analysisDoc._id),
      url: company.website ?? '',
    });

    await this.companyRepository.updateById(companyId, { $set: { analysisStatus: 'PROCESSING' } });
    await this.websiteAnalysisRepository.updateById(String(analysisDoc._id), {
      $set: { status: 'PROCESSING', retryCount: (analysisDoc.retryCount ?? 0) + 1 },
    });

    try {
      const result = await this.scraperProvider.scrape(company.website ?? '', 30_000);
      if (result.status === 'FAILED') {
        logger.error('Analysis failed', {
          companyId,
          websiteAnalysisId: String(analysisDoc._id),
          error: result.error,
        });
        throw new Error(result.error ?? 'Scrape failed');
      }

      const updated = await this.websiteAnalysisRepository.updateById(String(analysisDoc._id), {
        $set: {
          title: result.title,
          description: result.description,
          content: result.content,
          scrapedAt: new Date(),
          status: 'COMPLETED',
          error: undefined,
        },
      });

      await this.companyRepository.updateById(companyId, {
        $set: { analysisStatus: 'COMPLETED', lastAnalyzedAt: new Date() },
      });

      logger.info('Analysis completed', {
        companyId,
        websiteAnalysisId: String(analysisDoc._id),
        title: result.title,
      });

      return updated ?? analysisDoc;
    } catch (error) {
      const currentRetryCount = (analysisDoc.retryCount ?? 0) + 1;
      const shouldRetry = currentRetryCount <= 3;
      const nextStatus = shouldRetry ? 'PENDING' : 'FAILED';
      const updated = await this.websiteAnalysisRepository.updateById(String(analysisDoc._id), {
        $set: {
          status: nextStatus,
          retryCount: currentRetryCount,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      await this.companyRepository.updateById(companyId, {
        $set: { analysisStatus: nextStatus },
      });

      logger.error('Analysis failed', {
        companyId,
        websiteAnalysisId: String(analysisDoc._id),
        retryCount: currentRetryCount,
        error: error instanceof Error ? error.message : String(error),
      });

      return updated ?? analysisDoc;
    }
  }

  async getByCompany(ownerId: string, companyId: string): Promise<IWebsiteAnalysisDocument | null> {
    const company = await this.companyRepository.findByIdAndOwner(companyId, ownerId);
    if (!company) {
      throw new NotFoundError('Company');
    }
    return this.websiteAnalysisRepository.findByCompany(companyId);
  }
}
