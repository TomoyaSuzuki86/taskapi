import { useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { HistoryEntryCard } from '@/features/history/components/HistoryEntryCard';
import { HistoryEntryCardSkeleton } from '@/features/history/components/HistoryEntryCardSkeleton';
import { useAuth } from '@/features/auth/useAuth';
import { useHistory } from '@/features/history/useHistory';
import { useDataServices } from '@/services/useDataServices';
import type { HistoryEntry } from '@/types/domain';
import styles from './HistoryPage.module.css';

export function HistoryPage() {
  const { user } = useAuth();
  const { projectRepository, taskRepository } = useDataServices();
  const { entries, errorMessage, status } = useHistory(user!.uid);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoringEntryId, setRestoringEntryId] = useState<string | null>(null);
  const taskEntries = entries.filter((entry) => entry.entityType === 'task');
  const legacyProjectEntries = entries.filter(
    (entry) => entry.entityType === 'project' && entry.action === 'delete',
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
      {restoreError ? (
        <div className={styles.notice}>
          <p>{restoreError}</p>
        </div>
      ) : null}

      {status === 'loading' ? (
        <div className={styles.list}>
          <HistoryEntryCardSkeleton />
          <HistoryEntryCardSkeleton />
        </div>
      ) : status === 'error' ? (
        <div className={styles.notice}>
          <p>履歴の読み込みに失敗しました。</p>
          <p>{errorMessage}</p>
        </div>
      ) : taskEntries.length === 0 ? (
        <EmptyState title="タスク履歴はありません">
          <p />
        </EmptyState>
      ) : (
        <div className={styles.list}>
          {taskEntries.map((entry) => (
            <HistoryEntryCard
              key={entry.id}
              entry={entry}
              onRestore={
                entry.action === 'delete'
                  ? () => void handleRestore(entry)
                  : undefined
              }
              isRestoring={restoringEntryId === entry.id}
            />
          ))}
        </div>
      )}

      {status === 'ready' && legacyProjectEntries.length > 0 ? (
        <section className={styles.legacySection}>
          <h2 className={styles.legacyTitle}>旧データの復元</h2>
          <div className={styles.list}>
          {legacyProjectEntries.map((entry) => (
            <HistoryEntryCard
              key={entry.id}
              entry={entry}
              onRestore={() => void handleRestore(entry)}
              isRestoring={restoringEntryId === entry.id}
            />
          ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
