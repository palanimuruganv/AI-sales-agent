import { logger } from '../../utils/logger.js';
import type { ScraperProvider, ScrapeResult } from './scraperProvider.js';

export class FirecrawlProvider implements ScraperProvider {
  async scrape(url: string, timeoutMs = 30_000): Promise<ScrapeResult> {
    const normalizedUrl = this.normalizeUrl(url);
    logger.info('Firecrawl request', { url: normalizedUrl, timeoutMs });

    try {
      const response = await fetch(normalizedUrl, { signal: AbortSignal.timeout(timeoutMs) });
      logger.info('Firecrawl response', { url: normalizedUrl, status: response.status });

      if (!response.ok) {
        return { status: 'FAILED', error: `Request failed with status ${response.status}` };
      }

      const html = await response.text();
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

      return {
        title,
        description,
        content: content.slice(0, 8000),
        status: 'COMPLETED',
      };
    } catch (error) {
      logger.error('Firecrawl provider failed', {
        url: normalizedUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown scraper error',
      };
    }
  }

  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) {
      return trimmed;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (/^localhost/i.test(trimmed) || /^127(?:\.\d{1,3}){3}/i.test(trimmed) || /^0\.0\.0\.0/i.test(trimmed)) {
      return `http://${trimmed}`;
    }

    if (/^www\./i.test(trimmed)) {
      return `https://${trimmed}`;
    }

    if (/^[a-z0-9.-]+(:\d+)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }

    try {
      return new URL(trimmed).toString();
    } catch {
      return `https://${trimmed}`;
    }
  }

  private extractMetaDescription(html: string): string | undefined {
    const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    if (match?.[1]) {
      return match[1].trim();
    }
    return undefined;
  }
}
