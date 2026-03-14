import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  formatDateTimeLabel,
  formatHistoryActionLabel,
  formatHistoryEntityLabel,
} from '@/lib/ui/display';
import type { HistoryEntry } from '@/types/domain';
import styles from './HistoryEntryCard.module.css';

type HistoryEntryCardProps = {
  entry: HistoryEntry;
  onRestore?: () => void;
  isRestoring?: boolean;
};

export function HistoryEntryCard({
  entry,
  onRestore,
  isRestoring = false,
}: HistoryEntryCardProps) {
  const message = `${formatHistoryEntityLabel(entry.entityType)}「${entry.title}」を${formatHistoryActionLabel(entry.action)}`;
  const timestamp = formatDateTimeLabel(entry.createdAt);
  const canRestore = entry.action === 'delete' && onRestore;

  return (
    <Card>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        <span className={styles.timestamp}>{timestamp}</span>
      </div>
      {canRestore ? (
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onRestore}
            disabled={isRestoring}
          >
            {isRestoring ? '復元中...' : '復元'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
