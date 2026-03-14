import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { parseTagInput } from '@/features/tasks/tag-utils';
import { STORAGE_PROJECT_ID } from '@/lib/tasks/storage-project';
import { useDataServices } from '@/services/useDataServices';
import type { TaskStatus } from '@/types/domain';
import styles from './TaskCreateSheet.module.css';

type TaskCreateSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

const statusOptions = [
  { value: 'todo', label: '未着手' },
  { value: 'doing', label: '進行中' },
  { value: 'done', label: '完了' },
];

export function TaskCreateSheet({
  isOpen,
  onClose,
}: TaskCreateSheetProps) {
  const { user } = useAuth();
  const { taskRepository } = useDataServices();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const canCreate = title.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate || isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      await taskRepository.createTask(user!.uid, STORAGE_PROJECT_ID, {
        title,
        notes,
        tags: parseTagInput(tagInput),
        status,
        dueDate,
      });
      setTitle('');
      setNotes('');
      setTagInput('');
      setStatus('todo');
      setDueDate('');
      setErrorMessage(null);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'タスクの作成に失敗しました。',
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="タスクを追加">
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
          placeholder="必要なメモだけ残します"
          rows={3}
        />
        <Input
          label="タグ"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          placeholder="例: frontend, urgent"
        />
        <Select
          label="状態"
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
