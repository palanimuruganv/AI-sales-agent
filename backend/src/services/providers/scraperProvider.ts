/**
 * Structured error codes returned by scrapers.
 *
 * Retryable:     TIMEOUT | CONNECTION_REFUSED
 * Non-retryable: DNS_NOT_FOUND | INVALID_DOMAIN | SSL_ERROR | HTTP_403 | HTTP_404 | HTTP_ERROR | UNKNOWN
 */
export type ScrapeErrorCode =
  | 'DNS_NOT_FOUND'       // ENOTFOUND — domain does not exist in DNS
  | 'CONNECTION_REFUSED'  // ECONNREFUSED — server actively refused the connection
  | 'SSL_ERROR'           // TLS / certificate problem
  | 'TIMEOUT'             // Request exceeded the timeout window
  | 'HTTP_404'            // Server returned 404 Not Found
  | 'HTTP_403'            // Server returned 403 Forbidden
  | 'HTTP_ERROR'          // Any other non-2xx HTTP status
  | 'INVALID_DOMAIN'      // URL is empty, malformed, or structurally invalid
  | 'UNKNOWN';            // Unclassified error

/** Error codes that should never trigger a retry. */
export const NON_RETRYABLE_ERROR_CODES = new Set<ScrapeErrorCode>([
  'DNS_NOT_FOUND',
  'INVALID_DOMAIN',
  'SSL_ERROR',
  'HTTP_403',
  'HTTP_404',
]);

export interface ScrapeResult {
  title?: string;
  description?: string;
  content?: string;
  status: 'COMPLETED' | 'FAILED';
  /** Human-readable error message when status === 'FAILED'. */
  error?: string;
  /** Machine-readable classification of the failure. */
  errorCode?: ScrapeErrorCode;
}

export interface ScraperProvider {
  scrape(url: string, timeoutMs?: number): Promise<ScrapeResult>;
}
