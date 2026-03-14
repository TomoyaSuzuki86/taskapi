import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { useTasks } from '@/features/tasks/useTasks';
import type { TaskStatus } from '@/types/domain';
import styles from './TaskCreateSheet.module.css';

type TaskCreateSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
};

const statusOptions = [
  { value: 'todo', label: '未着手' },
  { value: 'doing', label: '進行中' },
  { value: 'done', label: '完了' },
];

export function TaskCreateSheet({
  isOpen,
  onClose,
  projectId,
}: TaskCreateSheetProps) {
  const { user } = useAuth();
  const { createTask, isCreating } = useTasks(user!.uid, projectId);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canCreate = title.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate || isCreating) {
      return;
    }

    try {
      await createTask({
        title,
        notes,
        status,
        dueDate,
      });
      setTitle('');
      setNotes('');
      setStatus('todo');
      setDueDate('');
      setErrorMessage(null);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'タスクの作成に失敗しました。',
      );
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="新しいタスク">
      <form onSubmit={handleSubmit} className={styles.form}>
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
        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        <Button type="submit" disabled={!canCreate || isCreating}>
          {isCreating ? '作成中...' : 'タスクを追加'}
        </Button>
      </form>
    </BottomSheet>
  );
}
