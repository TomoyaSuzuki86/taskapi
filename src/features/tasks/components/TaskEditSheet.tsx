import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { formatTagInput, parseTagInput } from '@/features/tasks/tag-utils';
import { useDataServices } from '@/services/useDataServices';
import type { Task, TaskStatus } from '@/types/domain';
import styles from './TaskEditSheet.module.css';

type TaskEditSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
};

const statusOptions = [
  { value: 'todo', label: '未着手' },
  { value: 'doing', label: '進行中' },
  { value: 'done', label: '完了' },
];

export function TaskEditSheet({
  isOpen,
  onClose,
  task,
}: TaskEditSheetProps) {
  const { user } = useAuth();
  const { taskRepository } = useDataServices();
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [tagInput, setTagInput] = useState(formatTagInput(task?.tags ?? []));
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  }, [task]);

  const canSave = title.trim().length > 0 && !isUpdating;

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
        error instanceof Error ? error.message : 'タスクの更新に失敗しました。',
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
      setIsDeleteDialogOpen(false);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'タスクの削除に失敗しました。',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="タスクを編集">
        {task ? (
          <form onSubmit={handleSave} className={styles.form}>
            <Input
              label="タスク名"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例: API のテストを書く"
              autoFocus
            />
            <Textarea
              label="メモ（任意）"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="補足や手順をメモできます"
              rows={3}
            />
            <Input
              label="タグ"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="例: frontend, urgent"
            />
            <Select
              label="ステータス"
              options={statusOptions}
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
            />
            <Input
              label="期限（任意）"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
            {errorMessage ? (
              <p className={styles.error}>{errorMessage}</p>
            ) : null}
            <div className={styles.buttonGroup}>
              <Button type="submit" disabled={!canSave || isUpdating}>
                {isUpdating ? '更新中...' : '更新する'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中...' : '削除'}
              </Button>
            </div>
          </form>
        ) : null}
      </BottomSheet>

      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="タスクを削除"
      >
        <p>このタスクを削除しますか。あとから履歴から復元できます。</p>
        <div className={styles.dialogButtonGroup}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            キャンセル
          </Button>
          <Button type="button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? '削除中...' : '削除する'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
