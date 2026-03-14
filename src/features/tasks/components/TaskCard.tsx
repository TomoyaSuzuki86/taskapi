import { Card } from '@/components/ui/Card';
import type { Task } from '@/services/contracts';
import styles from './TaskCard.module.css';

type TaskCardProps = {
  task: Task;
  onToggleStatus: (taskId: string, nextStatus: Task['status']) => void;
  onClick: (taskId: string) => void;
};

export function TaskCard({ task, onToggleStatus, onClick }: TaskCardProps) {
  const isDone = task.status === 'done';

  return (
    <Card>
      <div className={styles.container}>
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => onToggleStatus(task.id, isDone ? 'todo' : 'done')}
          className={styles.checkbox}
          aria-label={`${task.title} を完了にする`}
        />
        <div
          className={styles.content}
          onClick={() => onClick(task.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onClick(task.id);
            }
          }}
        >
          <h3 className={`${styles.title} ${isDone ? styles.completed : ''}`}>
            {task.title}
          </h3>
          {task.dueDate ? (
            <span className={styles.dueDate}>
              期限: {new Date(task.dueDate).toLocaleDateString('ja-JP')}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
