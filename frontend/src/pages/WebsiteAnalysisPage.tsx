import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WebsiteAnalysis } from '@/types';

export function WebsiteAnalysisPage() {
  const { companyId } = useParams();
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!companyId) {
        return;
      }
      try {
        const { data } = await apiClient.get<{ success: boolean; data: WebsiteAnalysis | null }>(`/website-analysis/${companyId}`);
        setAnalysis(data.data);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [companyId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading analysis…</p>;
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Website overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={analysis.status === 'COMPLETED' ? 'success' : analysis.status === 'FAILED' ? 'destructive' : 'warning'}>
              {analysis.status}
            </Badge>
            <span className="text-sm text-muted-foreground">Retries: {analysis.retryCount}</span>
          </div>
          <p className="text-sm font-medium">Title: {analysis.title ?? '—'}</p>
          <p className="text-sm text-muted-foreground">Description: {analysis.description ?? '—'}</p>
          <p className="text-sm text-muted-foreground">URL: {analysis.url}</p>
          <p className="text-sm text-muted-foreground">Scraped: {analysis.scrapedAt ? new Date(analysis.scrapedAt).toLocaleString() : 'Not available'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extracted content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-7">{analysis.content ?? 'No extracted content available.'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
