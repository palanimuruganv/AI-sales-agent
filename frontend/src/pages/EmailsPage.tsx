import { useQuery } from '@tanstack/react-query';
import { listEmails } from '@/services/emailService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function EmailsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['emails'],
    queryFn: () => listEmails(1, 50),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emails</h1>
        <p className="text-muted-foreground">Personalized outreach drafts and send status</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outbox</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : data?.data.length ? (
            <ul className="space-y-4">
              {data.data.map((e) => (
                <li key={e._id} className="rounded-md border p-4 text-sm">
                  <p className="font-medium">{e.subject}</p>
                  <p className="text-muted-foreground">
                    {e.status} · company {e.companyId}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No emails yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
