import { Card } from '@/components/ui/Card';
import { PageSkeleton } from '@/components/skeleton/PageSkeleton';
import { useAuth } from '@/features/auth/useAuth';
import { useHistory } from '@/features/history/useHistory';

export function HistoryPage() {
  const { user } = useAuth();
  const { entries, errorMessage, status } = useHistory(user!.uid);

  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">Recent activity</p>
        <h2>History</h2>
        <p className="muted-copy">
          Recent project and task actions are shown in reverse chronological
          order.
        </p>
      </Card>

      <Card tone="muted">
        {status === 'loading' ? (
          <PageSkeleton />
        ) : status === 'error' ? (
          <p className="muted-copy">{errorMessage}</p>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <h3>No history yet</h3>
            <p className="muted-copy">
              Project and task actions will appear here once you start using the
              app.
            </p>
          </div>
        ) : (
          <div className="stack">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <div className="stack stack--tight">
                  <div className="section-heading section-heading--compact">
                    <div>
                      <p className="section-heading__eyebrow">
                        {entry.entityType}
                      </p>
                      <h3>{entry.title}</h3>
                    </div>
                    <span className="pill">{entry.action}</span>
                  </div>
                  <p className="muted-copy">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
