import { Card } from '@/components/ui/Card';
import type { Task } from '@/services/contracts';
import styles from './TaskCard.module.css';

type TaskCardProps = {
  task: Task;
  onToggleStatus: (taskId: string, nextStatus: Task['status']) => void;
  onClick: (taskId: string) => void;
  meta?: string;
  disabled?: boolean;
  tone?: 'today' | 'upcoming' | 'later';
};

export function TaskCard({
  task,
  onToggleStatus,
  onClick,
  meta,
  disabled = false,
  tone = 'later',
}: TaskCardProps) {
  const isDone = task.status === 'done';
  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
      })
    : null;

  return (
    <Card>
      <div className={`${styles.container} ${styles[tone]}`}>
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => onToggleStatus(task.id, isDone ? 'todo' : 'done')}
          className={styles.checkbox}
          disabled={disabled}
          aria-label={`${task.title} を完了状態にする`}
        />
        <div
          className={styles.content}
          onClick={() => {
            if (!disabled) {
              onClick(task.id);
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onKeyDown={(event) => {
            if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onClick(task.id);
            }
          }}
        >
          <div className={styles.topline}>
            <h3 className={`${styles.title} ${isDone ? styles.completed : ''}`}>
              {task.title}
            </h3>
            {dueLabel ? <span className={styles.dueBadge}>{dueLabel}</span> : null}
          </div>
          {task.tags.length > 0 ? (
            <div className={styles.tags}>
              {task.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
          {meta ? <span className={styles.meta}>{meta}</span> : null}
        </div>
      </div>
    </Card>
  );
}
