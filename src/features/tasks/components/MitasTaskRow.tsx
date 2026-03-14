import type { Task } from '@/types/domain';
import styles from './MitasTaskRow.module.css';

type MitasTaskRowProps = {
  task: Task;
  disabled?: boolean;
  onToggleStatus: (taskId: string, nextStatus: Task['status']) => void;
  onOpen: (taskId: string) => void;
};

export function MitasTaskRow({
  task,
  disabled = false,
  onToggleStatus,
  onOpen,
}: MitasTaskRowProps) {
  const isDone = task.status === 'done';
  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
      })
    : null;

  return (
    <article className={`${styles.row} ${isDone ? styles.done : ''}`}>
      <button
        type="button"
        className={`${styles.toggle} ${isDone ? styles.toggleDone : ''}`}
        onClick={() => onToggleStatus(task.id, isDone ? 'todo' : 'done')}
        disabled={disabled}
        aria-label={`Toggle ${task.title}`}
      >
        <span className={styles.toggleGlyph}>{isDone ? '✓' : ''}</span>
      </button>

      <div className={styles.body}>
        <div className={styles.topline}>
          <button
            type="button"
            className={styles.title}
            onClick={() => onOpen(task.id)}
            disabled={disabled}
          >
            {task.title}
          </button>
          {dueLabel ? <span className={styles.due}>{dueLabel}</span> : null}
        </div>

        {task.notes ? <p className={styles.notes}>{task.notes}</p> : null}

        {task.tags.length > 0 ? (
          <div className={styles.tags}>
            {task.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
