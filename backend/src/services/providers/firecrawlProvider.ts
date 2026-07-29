import { logger } from '../../utils/logger.js';
import type { ScraperProvider, ScrapeResult, ScrapeErrorCode } from './scraperProvider.js';

/**
 * FirecrawlProvider — a simple HTTP scraper.
 *
 * Expects an already-normalized, fully-qualified URL (e.g. "https://openai.com").
 * URL normalization is the responsibility of the caller (WebsiteAnalysisService).
 *
 * Every failure path returns a structured ScrapeErrorCode so callers can decide
 * whether to retry and users can see a meaningful message in the UI.
 */
export class FirecrawlProvider implements ScraperProvider {
  async scrape(url: string, timeoutMs = 30_000): Promise<ScrapeResult> {
    logger.info('[FirecrawlProvider] Firecrawl request', { url, timeoutMs });

    // ── Guard: empty / invalid URL ────────────────────────────────────────────
    if (!url || !this.isValidUrl(url)) {
      logger.error('[FirecrawlProvider] Invalid or empty URL', { url });
      return {
        status: 'FAILED',
        errorCode: 'INVALID_DOMAIN',
        error: `"${url}" is not a valid URL. Please check the company website field.`,
      };
    }

    // ── Fetch ─────────────────────────────────────────────────────────────────
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (fetchError) {
      return this.classifyFetchError(url, fetchError);
    }

    logger.info('[FirecrawlProvider] Firecrawl response', {
      url,
      httpStatus: response.status,
      ok: response.ok,
    });

    // ── HTTP error codes ──────────────────────────────────────────────────────
    if (!response.ok) {
      return this.classifyHttpError(url, response.status);
    }

    // ── Parse HTML ────────────────────────────────────────────────────────────
    let html: string;
    try {
      html = await response.text();
    } catch (readError) {
      logger.error('[FirecrawlProvider] Failed to read response body', {
        url,
        error: readError instanceof Error ? readError.message : String(readError),
      });
      return {
        status: 'FAILED',
        errorCode: 'UNKNOWN',
        error: 'Failed to read the page content after a successful connection.',
      };
    }

    logger.info('[FirecrawlProvider] HTML received', { url, htmlLength: html.length });

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim();

    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const description = this.extractMetaDescription(html);

    logger.info('[FirecrawlProvider] Parsing complete', {
      url,
      title,
      description: description?.slice(0, 120) ?? null,
      contentLength: content.length,
    });

    return {
      title,
      description,
      content: content.slice(0, 8_000),
      status: 'COMPLETED',
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Classifies a thrown fetch() exception into a structured ScrapeErrorCode.
   *
   * Node's undici-based fetch throws TypeError for network-level errors.
   * The underlying system error code is embedded in the message.
   */
  private classifyFetchError(url: string, error: unknown): ScrapeResult {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : '';
    const lc = message.toLowerCase();

    let errorCode: ScrapeErrorCode;
    let friendlyMessage: string;

    if (name === 'TimeoutError' || name === 'AbortError' || lc.includes('timed out') || lc.includes('abort')) {
      errorCode = 'TIMEOUT';
      friendlyMessage = `Request to ${url} timed out. The server may be slow or unreachable.`;
    } else if (lc.includes('enotfound') || lc.includes('getaddrinfo') || lc.includes('name or service not known')) {
      errorCode = 'DNS_NOT_FOUND';
      friendlyMessage = `Domain not found for ${url}. Check that the website URL is correct.`;
    } else if (lc.includes('econnrefused') || lc.includes('connection refused')) {
      errorCode = 'CONNECTION_REFUSED';
      friendlyMessage = `Connection refused by ${url}. The server may be down or blocking requests.`;
    } else if (
      lc.includes('ssl') ||
      lc.includes('certificate') ||
      lc.includes('cert_') ||
      lc.includes('unable to verify') ||
      lc.includes('self-signed')
    ) {
      errorCode = 'SSL_ERROR';
      friendlyMessage = `SSL/TLS certificate error for ${url}. The site may have an invalid or expired certificate.`;
    } else {
      errorCode = 'UNKNOWN';
      friendlyMessage = message;
    }

    logger.error('[FirecrawlProvider] Fetch error classified', { url, errorCode, message });

    return { status: 'FAILED', errorCode, error: friendlyMessage };
  }

  /** Maps HTTP status codes to structured error codes. */
  private classifyHttpError(url: string, status: number): ScrapeResult {
    let errorCode: ScrapeErrorCode;
    let error: string;

    if (status === 404) {
      errorCode = 'HTTP_404';
      error = `Page not found (404) at ${url}. The URL may have moved or been removed.`;
    } else if (status === 403) {
      errorCode = 'HTTP_403';
      error = `Access forbidden (403) from ${url}. The site is blocking automated requests.`;
    } else {
      errorCode = 'HTTP_ERROR';
      error = `HTTP ${status} received from ${url}.`;
    }

    logger.error('[FirecrawlProvider] HTTP error classified', { url, status, errorCode });

    return { status: 'FAILED', errorCode, error };
  }

  /** Returns true when the URL is structurally valid enough to attempt a fetch. */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Extracts the content of <meta name="description"> regardless of attribute order.
   *
   * Handles both:
   *   <meta name="description" content="…">
   *   <meta content="…" name="description">
   */
  private extractMetaDescription(html: string): string | undefined {
    let match = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    );
    if (match?.[1]) return match[1].trim();

    match = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i,
    );
    if (match?.[1]) return match[1].trim();

    return undefined;
  }
}
