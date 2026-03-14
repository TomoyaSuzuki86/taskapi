import { useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/useAuth';
import { HistoryEntryCard } from '@/features/history/components/HistoryEntryCard';
import { HistoryEntryCardSkeleton } from '@/features/history/components/HistoryEntryCardSkeleton';
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

  const handleRestore = async (entry: HistoryEntry) => {
    setRestoringEntryId(entry.id);
    setRestoreError(null);

    try {
      if (entry.entityType === 'project') {
        await projectRepository.restoreProject(user!.uid, entry.entityId);
      } else {
        if (!entry.projectId) {
          throw new Error('タスクの復元に必要な projectId がありません。');
        }

        await taskRepository.restoreTask(
          user!.uid,
          entry.projectId,
          entry.entityId,
        );
      }
    } catch (error) {
      setRestoreError(
        error instanceof Error ? error.message : '復元に失敗しました。',
      );
    } finally {
      setRestoringEntryId(null);
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <>
          <HistoryEntryCardSkeleton />
          <HistoryEntryCardSkeleton />
          <HistoryEntryCardSkeleton />
        </>
      );
    }

    if (status === 'error') {
      return (
        <div className={styles.notice}>
          <p>履歴の読み込みに失敗しました。</p>
          <p>{errorMessage}</p>
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <EmptyState title="まだ履歴がありません">
          <p>プロジェクトやタスクを変更すると、ここに履歴が表示されます。</p>
        </EmptyState>
      );
    }

    return entries.map((entry) => (
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
    ));
  };

  return (
    <div className={styles.container}>
      <Card>
        <h2 className={styles.pageTitle}>変更履歴</h2>
        <p className={styles.pageDescription}>
          プロジェクトとタスクの変更を新しい順に確認できます。削除や復元の記録もここに残ります。
        </p>
      </Card>
      {restoreError ? (
        <div className={styles.notice}>
          <p>{restoreError}</p>
        </div>
      ) : null}
      <div className={styles.grid}>{renderContent()}</div>
    </div>
  );
}
