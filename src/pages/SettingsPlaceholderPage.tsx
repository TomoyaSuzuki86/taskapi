import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { HistoryEntryCard } from '@/features/history/components/HistoryEntryCard';
import { HistoryEntryCardSkeleton } from '@/features/history/components/HistoryEntryCardSkeleton';
import { useHistory } from '@/features/history/useHistory';
import { useDataServices } from '@/services/useDataServices';
import type { HistoryEntry } from '@/types/domain';
import styles from './SettingsPlaceholderPage.module.css';

export function SettingsPlaceholderPage() {
  const { activeAction, signOut, user } = useAuth();
  const { projectRepository, taskRepository } = useDataServices();
  const { entries, status, errorMessage } = useHistory(user!.uid);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoringEntryId, setRestoringEntryId] = useState<string | null>(null);

  const restoreEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.entityType === 'task' && entry.action === 'delete')
        .slice(0, 5),
    [entries],
  );
  const legacyProjectEntries = useMemo(
    () =>
      entries
        .filter(
          (entry) => entry.entityType === 'project' && entry.action === 'delete',
        )
        .slice(0, 3),
    [entries],
  );

  const handleRestore = async (entry: HistoryEntry) => {
    setRestoringEntryId(entry.id);
    setRestoreError(null);

    try {
      if (entry.entityType === 'project') {
        await projectRepository.restoreProject(user!.uid, entry.entityId);
        return;
      }

      if (!entry.projectId) {
        throw new Error('タスクの復元に必要な projectId がありません。');
      }

      await taskRepository.restoreTask(user!.uid, entry.projectId, entry.entityId);
    } catch (error) {
      setRestoreError(
        error instanceof Error ? error.message : '復元に失敗しました。',
      );
    } finally {
      setRestoringEntryId(null);
    }
  };

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.formStack}>
          <Input label="表示名" value={user?.displayName ?? ''} disabled />
          <Input label="メールアドレス" value={user?.email ?? ''} disabled />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void signOut()}
            disabled={activeAction === 'sign_out'}
          >
            {activeAction === 'sign_out' ? 'ログアウト中...' : 'ログアウト'}
          </Button>
        </div>
      </Card>

      <Card>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>タスクの復元</h2>
          <Link to="/history" className="button button--secondary">
            履歴を見る
          </Link>
        </div>

        {restoreError ? (
          <div className={styles.notice}>
            <p>{restoreError}</p>
          </div>
        ) : null}

        <div className={styles.restoreList}>
          {status === 'loading' ? (
            <>
              <HistoryEntryCardSkeleton />
              <HistoryEntryCardSkeleton />
            </>
          ) : status === 'error' ? (
            <div className={styles.notice}>
              <p>履歴の読み込みに失敗しました。</p>
              <p>{errorMessage}</p>
            </div>
          ) : restoreEntries.length === 0 ? (
            <EmptyState title="戻せるタスクはありません">
              <p />
            </EmptyState>
          ) : (
            restoreEntries.map((entry) => (
              <HistoryEntryCard
                key={entry.id}
                entry={entry}
                onRestore={() => void handleRestore(entry)}
                isRestoring={restoringEntryId === entry.id}
              />
            ))
          )}
        </div>
      </Card>

      {legacyProjectEntries.length > 0 ? (
        <Card>
          <div className={styles.sectionHeader}>
            <h2 className={styles.title}>旧データの復元</h2>
          </div>
          <div className={styles.restoreList}>
            {legacyProjectEntries.map((entry) => (
              <HistoryEntryCard
                key={entry.id}
                entry={entry}
                onRestore={() => void handleRestore(entry)}
                isRestoring={restoringEntryId === entry.id}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
