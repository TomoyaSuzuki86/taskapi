import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuth } from '@/features/auth/useAuth';
import { useProjects } from '@/features/projects/useProjects';
import styles from './ProjectCreateSheet.module.css';

type ProjectCreateSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ProjectCreateSheet({
  isOpen,
  onClose,
}: ProjectCreateSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createProject, isCreating } = useProjects(user!.uid);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canCreate = name.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate || isCreating) {
      return;
    }

    try {
      const newProjectId = await createProject({ name, description });
      setName('');
      setDescription('');
      setErrorMessage(null);
      onClose();
      navigate(`/projects/${newProjectId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'プロジェクトの作成に失敗しました。',
      );
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="新しいプロジェクト">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="projectName">プロジェクト名</label>
          <input
            id="projectName"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例: 今週の作業"
            autoFocus
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="projectDescription">説明（任意）</label>
          <textarea
            id="projectDescription"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="例: 目的や進め方のメモ"
            rows={3}
          />
        </div>
        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={!canCreate || isCreating}
          className={styles.submitButton}
        >
          {isCreating ? '作成中...' : 'プロジェクトを作成'}
        </button>
      </form>
    </BottomSheet>
  );
}
