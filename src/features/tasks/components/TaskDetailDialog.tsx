import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { formatTagInput, parseTagInput } from '@/features/tasks/tag-utils';
import { useDataServices } from '@/services/useDataServices';
import type { Task, TaskStatus } from '@/types/domain';
import styles from './TaskDetailDialog.module.css';

type TaskDetailDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
};

const statusOptions = [
  { value: 'todo', label: 'Todo' },
  { value: 'doing', label: 'Doing' },
  { value: 'done', label: 'Done' },
];

export function TaskDetailDialog({
  isOpen,
  onClose,
  task,
}: TaskDetailDialogProps) {
  const { user } = useAuth();
  const { taskRepository } = useDataServices();
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [tagInput, setTagInput] = useState(formatTagInput(task?.tags ?? []));
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!task) {
      return;
    }

    setTitle(task.title);
    setNotes(task.notes ?? '');
    setTagInput(formatTagInput(task.tags));
    setStatus(task.status);
    setDueDate(task.dueDate?.slice(0, 10) ?? '');
    setErrorMessage(null);
    setIsConfirmingDelete(false);
  }, [task]);

  const canSave = title.trim().length > 0 && !isUpdating && !isDeleting;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!task || !canSave) {
      return;
    }

    try {
      setIsUpdating(true);
      await taskRepository.updateTask(user!.uid, task.projectId, task.id, {
        title,
        notes,
        tags: parseTagInput(tagInput),
        status,
        dueDate,
      });
      setErrorMessage(null);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update task.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!task) {
      return;
    }

    try {
      setIsDeleting(true);
      await taskRepository.deleteTask(user!.uid, task.projectId, task.id);
      setErrorMessage(null);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to delete task.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={task?.title ?? 'Task'}>
      {task ? (
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.fields}>
            <Input
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a clear title"
              autoFocus
            />
            <Textarea
              label="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write details, context, or links"
              rows={4}
            />
            <Input
              label="Tags"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="frontend, review, waiting"
            />
            <div className={styles.split}>
              <Select
                label="Status"
                options={statusOptions}
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
              />
              <Input
                label="Due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>

          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

          <div className={styles.actions}>
            <div className={styles.deleteZone}>
              {isConfirmingDelete ? (
                <>
                  <span className={styles.confirmCopy}>Delete this task?</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isUpdating || isDeleting}
                >
                  Delete
                </Button>
              )}
            </div>

            <Button type="submit" disabled={!canSave}>
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
