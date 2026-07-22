import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createCompany,
  deleteCompany,
  listCompanies,
} from '@/services/companyService';
import { getErrorMessage } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: () => listCompanies(1, 50),
  });

  const createMutation = useMutation({
    mutationFn: () => createCompany({ companyName }),
    onSuccess: () => {
      setCompanyName('');
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Companies</h1>
        <p className="text-muted-foreground">Import targets and track pipeline status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add company</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <Button
            onClick={() => {
              setError('');
              createMutation.mutate();
            }}
            disabled={!companyName.trim() || createMutation.isPending}
          >
            Create
          </Button>
        </CardContent>
        {error ? <p className="px-6 pb-4 text-sm text-destructive">{error}</p> : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All companies</CardTitle>
        </CardHeader>
        <CardContent>
          {companiesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="divide-y">
              {companiesQuery.data?.data.map((c) => (
                <li key={c._id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{c.companyName}</p>
                    <p className="text-muted-foreground">
                      {c.status} · score {c.leadScore ?? '—'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(c._id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
