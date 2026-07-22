import { useQuery } from '@tanstack/react-query';
import { listAnalyses } from '@/services/analysisService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalysesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => listAnalyses(1, 50),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analyses</h1>
        <p className="text-muted-foreground">
          AI-generated insights (create via API until analysis UI ships)
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : data?.data.length ? (
            <ul className="space-y-4">
              {data.data.map((a) => (
                <li key={a._id} className="rounded-md border p-4 text-sm">
                  <p className="font-medium">Company {a.companyId}</p>
                  <p className="text-muted-foreground">Priority: {a.priority}</p>
                  {a.aiSummary ? <p className="mt-2">{a.aiSummary}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No analyses yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
