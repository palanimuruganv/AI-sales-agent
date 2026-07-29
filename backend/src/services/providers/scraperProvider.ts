export interface ScrapeResult {
  title?: string;
  description?: string;
  content?: string;
  status: 'COMPLETED' | 'FAILED';
  error?: string;
}

export interface ScraperProvider {
  scrape(url: string, timeoutMs?: number): Promise<ScrapeResult>;
}
