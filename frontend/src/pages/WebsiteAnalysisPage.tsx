import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WebsiteAnalysis, ScrapeErrorCode } from '@/types';

// ── Error code metadata ──────────────────────────────────────────────────────

interface ErrorMeta {
  label: string;
  hint: string;
  retryable: boolean;
}

const ERROR_META: Record<ScrapeErrorCode, ErrorMeta> = {
  DNS_NOT_FOUND: {
    label: 'Domain not found',
    hint: 'The domain could not be resolved via DNS. Verify that the website URL is spelled correctly.',
    retryable: false,
  },
  CONNECTION_REFUSED: {
    label: 'Connection refused',
    hint: 'The server actively rejected the connection. It may be temporarily down or blocking requests.',
    retryable: true,
  },
  SSL_ERROR: {
    label: 'SSL / TLS error',
    hint: 'The site has an invalid, expired, or self-signed certificate. Secure scraping is not possible.',
    retryable: false,
  },
  TIMEOUT: {
    label: 'Request timed out',
    hint: 'The server took too long to respond. The site may be slow or temporarily unreachable. Retry later.',
    retryable: true,
  },
  HTTP_404: {
    label: 'Page not found (404)',
    hint: 'The URL returned a 404. The page may have moved or been deleted. Update the company website.',
    retryable: false,
  },
  HTTP_403: {
    label: 'Access forbidden (403)',
    hint: 'The server is blocking automated requests. This site cannot be scraped without authentication.',
    retryable: false,
  },
  HTTP_ERROR: {
    label: 'HTTP error',
    hint: 'The server returned an unexpected HTTP error code.',
    retryable: true,
  },
  INVALID_DOMAIN: {
    label: 'Invalid domain',
    hint: 'The website URL is malformed or missing. Please update the company website field.',
    retryable: false,
  },
  UNKNOWN: {
    label: 'Unknown error',
    hint: 'An unexpected error occurred. Check the server logs for details.',
    retryable: true,
  },
};

// ── Sub-components ──────────────────────────────────────────────────────────

function ErrorPanel({ analysis }: { analysis: WebsiteAnalysis }) {
  const meta = analysis.errorCode ? ERROR_META[analysis.errorCode] : null;

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-destructive flex items-center gap-2">
          <span>⚠ Scraping failed</span>
          {analysis.errorCode && (
            <code className="rounded bg-destructive/15 px-1.5 py-0.5 text-xs font-mono">
              {analysis.errorCode}
            </code>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {meta && (
          <>
            <p className="font-medium text-destructive">{meta.label}</p>
            <p className="text-muted-foreground">{meta.hint}</p>
          </>
        )}
        {analysis.error && (
          <p className="rounded bg-muted/60 px-3 py-2 font-mono text-xs break-all">
            {analysis.error}
          </p>
        )}
        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          {meta?.retryable ? (
            <span className="text-amber-600">⟳ This error is retryable — click Analyze again.</span>
          ) : (
            <span className="text-destructive">✕ This error will not improve on retry. Fix the website URL first.</span>
          )}
          <span>·</span>
          <span>Attempt {analysis.retryCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function WebsiteAnalysisPage() {
  const { companyId } = useParams();
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!companyId) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await apiClient.get<{ success: boolean; data: WebsiteAnalysis | null }>(
          `/website-analysis/${companyId}`,
        );
        setAnalysis(data.data);
        setFetchError(null);
      } catch (err: unknown) {
        setFetchError(
          err instanceof Error ? err.message : 'Failed to load website analysis data.',
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [companyId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading analysis…</p>;
  }

  if (fetchError) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-destructive">Could not load analysis</p>
        <p className="text-sm text-muted-foreground">{fetchError}</p>
      </div>
    );
  }

  if (!analysis) {
    return <p className="text-sm text-muted-foreground">No website analysis found yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analysis details</h1>
        <p className="text-muted-foreground">Website scrape details and extracted content</p>
      </div>

      {/* Show the structured error panel when the scrape failed */}
      {analysis.status === 'FAILED' && <ErrorPanel analysis={analysis} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Website overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                analysis.status === 'COMPLETED'
                  ? 'success'
                  : analysis.status === 'FAILED'
                    ? 'destructive'
                    : 'warning'
              }
            >
              {analysis.status}
            </Badge>
            <span className="text-sm text-muted-foreground">Retries: {analysis.retryCount}</span>
          </div>
          <p className="text-sm font-medium">Title: {analysis.title ?? '—'}</p>
          <p className="text-sm text-muted-foreground">
            Description: {analysis.description ?? '—'}
          </p>
          <p className="text-sm text-muted-foreground">URL: {analysis.url}</p>
          <p className="text-sm text-muted-foreground">
            Scraped:{' '}
            {analysis.scrapedAt ? new Date(analysis.scrapedAt).toLocaleString() : 'Not available'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extracted content</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.status === 'COMPLETED' && analysis.content ? (
            <p className="whitespace-pre-wrap text-sm leading-7">{analysis.content}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No extracted content available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
