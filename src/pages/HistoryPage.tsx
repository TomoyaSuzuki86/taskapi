import { Card } from '@/components/ui/Card';
import { PageSkeleton } from '@/components/skeleton/PageSkeleton';
import { useAuth } from '@/features/auth/useAuth';
import { useHistory } from '@/features/history/useHistory';
import {
  formatDateTimeLabel,
  formatHistoryActionLabel,
  formatHistoryEntityLabel,
} from '@/lib/ui/display';

export function HistoryPage() {
  const { user } = useAuth();
  const { entries, errorMessage, status } = useHistory(user!.uid);

  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">Recent activity</p>
        <h2>更新履歴</h2>
        <p className="muted-copy">
          プロジェクトとタスクの変更を新しい順に確認できます。削除や復元もこの一覧から追跡できます。
        </p>
      </Card>

      <Card tone="muted">
        {status === 'loading' ? (
          <PageSkeleton />
        ) : status === 'error' ? (
          <p className="muted-copy">{errorMessage}</p>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <h3>まだ履歴がありません</h3>
            <p className="muted-copy">
              プロジェクトやタスクを操作すると、ここに履歴が表示されます。
            </p>
          </div>
        ) : (
          <div className="workspace-list">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <div className="workspace-row">
                  <div className="workspace-row__main">
                    <p className="section-heading__eyebrow">
                      {formatHistoryEntityLabel(entry.entityType)}
                    </p>
                    <h3>{entry.title}</h3>
                    <p className="workspace-row__meta">
                      {formatDateTimeLabel(entry.createdAt)}
                    </p>
                  </div>
                  <div className="button-row workspace-row__actions">
                    <span className="pill">
                      {formatHistoryActionLabel(entry.action)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
