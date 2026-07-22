import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listCompanies } from '@/services/companyService';
import { listAnalyses } from '@/services/analysisService';
import { listEmails } from '@/services/emailService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const companies = useQuery({ queryKey: ['companies', 1], queryFn: () => listCompanies(1, 5) });
  const analyses = useQuery({ queryKey: ['analyses', 1], queryFn: () => listAnalyses(1, 5) });
  const emails = useQuery({ queryKey: ['emails', 1], queryFn: () => listEmails(1, 5) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Pipeline overview and quick actions</p>
        </div>
        <Button asChild>
          <Link to="/companies">Manage companies</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{companies.data?.total ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{analyses.data?.total ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{emails.data?.total ?? '—'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
