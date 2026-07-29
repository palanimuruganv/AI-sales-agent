import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCompanies, uploadCompanies } from '@/services/companyService';
import { analyzeCompany } from '@/services/analysisService';
import { getErrorMessage } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Company } from '@/types';

const pageSize = 8;

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [uploadSummary, setUploadSummary] = useState<{ uploaded: number; duplicates: number; failed: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const companiesQuery = useQuery({
    queryKey: ['companies', page],
    queryFn: () => listCompanies(page, pageSize),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCompanies(file),
    onSuccess: (summary) => {
      setUploadSummary(summary);
      setError('');
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const filteredCompanies = useMemo(() => {
    const source = companiesQuery.data?.data ?? [];
    const term = search.toLowerCase();
    return source.filter((company: Company) => {
      return [company.companyName, company.industry, company.country, company.analysisStatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [companiesQuery.data?.data, search]);

  const handleFileSelect = (file?: File | null) => {
    if (!file) {
      return;
    }
    setError('');
    uploadMutation.mutate(file);
  };

  const handleAnalyze = async (companyId: string) => {
    try {
      await analyzeCompany(companyId);
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Companies</h1>
        <p className="text-muted-foreground">Upload CSV imports, review results, and track analysis status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center transition ${isDragging ? 'border-primary bg-accent/40' : 'border-border'}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFileSelect(event.dataTransfer.files?.[0]);
            }}
          >
            <p className="text-sm font-medium">Drag and drop a CSV file here</p>
            <p className="mt-2 text-sm text-muted-foreground">Maximum size 10 MB · CSV only</p>
            <div className="mt-4 flex justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
                Browse files
              </Button>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files?.[0])}
              />
            </div>
          </div>

          {uploadMutation.isPending ? <p className="text-sm text-muted-foreground">Uploading and processing…</p> : null}

          {uploadSummary ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex flex-wrap gap-3">
                <Badge variant="success">Uploaded {uploadSummary.uploaded}</Badge>
                <Badge variant="warning">Duplicates {uploadSummary.duplicates}</Badge>
                <Badge variant="destructive">Failed {uploadSummary.failed}</Badge>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Company directory</CardTitle>
          </div>
          <Input
            placeholder="Search companies"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {companiesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading companies…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 pr-4">Company</th>
                    <th className="py-3 pr-4">Industry</th>
                    <th className="py-3 pr-4">Country</th>
                    <th className="py-3 pr-4">Analysis Status</th>
                    <th className="py-3 pr-4">Lead Score</th>
                    <th className="py-3 pr-4">Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company: Company) => (
                    <tr key={company._id} className="border-b">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{company.companyName}</div>
                        <div className="text-xs text-muted-foreground">{company.website}</div>
                      </td>
                      <td className="py-3 pr-4">{company.industry ?? '—'}</td>
                      <td className="py-3 pr-4">{company.country ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={company.analysisStatus === 'COMPLETED' ? 'success' : company.analysisStatus === 'FAILED' ? 'destructive' : 'warning'}>
                          {company.analysisStatus ?? 'PENDING'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{company.leadScore ?? '—'}</td>
                      <td className="py-3 pr-4">{new Date(company.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => void handleAnalyze(company._id)}>
                            Analyze
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/website-analysis/${company._id}`)}>
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {page} of {companiesQuery.data?.totalPages ?? 1}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page >= (companiesQuery.data?.totalPages ?? 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
