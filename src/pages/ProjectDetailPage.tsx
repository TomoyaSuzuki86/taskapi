import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FAB } from '@/components/ui/FAB';
import { useAuth } from '@/features/auth/useAuth';
import { useProject } from '@/features/projects/useProject';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskCardSkeleton } from '@/features/tasks/components/TaskCardSkeleton';
import { TaskCreateSheet } from '@/features/tasks/components/TaskCreateSheet';
import { TaskEditSheet } from '@/features/tasks/components/TaskEditSheet';
import { useTasks } from '@/features/tasks/useTasks';
import type { Task, TaskStatus } from '@/types/domain';
import styles from './ProjectDetailPage.module.css';

export function ProjectDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectId = '' } = useParams();
  const {
    project,
    status: projectStatus,
    errorMessage: projectErrorMessage,
  } = useProject(user!.uid, projectId);
  const {
    tasks,
    deletedTasks,
    status: tasksStatus,
    errorMessage: tasksErrorMessage,
    updateTask,
    restoreTask,
    busyTaskId,
  } = useTasks(user!.uid, projectId);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleToggleTaskStatus = async (
    taskId: string,
    nextStatus: TaskStatus,
  ) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    try {
      await updateTask(taskId, {
        title: task.title,
        notes: task.notes ?? '',
        status: nextStatus,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      });
      setLocalError(null);
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'タスクの更新に失敗しました。',
      );
    }
  };

  const handleTaskClick = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setIsEditSheetOpen(true);
    }
  };

  if (projectStatus === 'loading') {
    return (
      <div className={styles.container}>
        <Card>
          <div className={styles.projectHeader}>
            <div className={styles.projectTitleSkeleton} />
            <div className={styles.projectMetaSkeleton} />
          </div>
        </Card>
        <div className={styles.grid}>
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      </div>
    );
  }

  if (projectStatus === 'error') {
    return (
      <div className={styles.container}>
        <Card>
          <p className={styles.errorTitle}>
            プロジェクトの読み込みに失敗しました
          </p>
          <p className={styles.errorMessage}>{projectErrorMessage}</p>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.container}>
        <Card>
          <p className={styles.errorTitle}>プロジェクトが見つかりません</p>
          <p className={styles.errorMessage}>
            このプロジェクトは利用できないか、削除されている可能性があります。
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className={styles.backButton}
          >
            ホームへ戻る
          </button>
        </Card>
      </div>
    );
  }

  const renderTasksContent = () => {
    if (tasksStatus === 'loading') {
      return (
        <>
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </>
      );
    }

    if (tasksStatus === 'error') {
      return (
        <div className={styles.notice}>
          <p>タスクの読み込みに失敗しました。</p>
          <p>{tasksErrorMessage}</p>
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <EmptyState title="タスクがありません">
          <p>最初のタスクを追加して、このプロジェクトを進めましょう。</p>
        </EmptyState>
      );
    }

    return tasks.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        onToggleStatus={handleToggleTaskStatus}
        onClick={handleTaskClick}
      />
    ));
  };

  return (
    <>
      <div className={styles.container}>
        <Card>
          <div className={styles.projectHeader}>
            <h2 className={styles.projectTitle}>{project.name}</h2>
            {project.description ? (
              <p className={styles.projectDescription}>{project.description}</p>
            ) : null}
          </div>
        </Card>

        {localError ? (
          <div className={styles.notice}>
            <p>{localError}</p>
          </div>
        ) : null}

        <div className={styles.grid}>{renderTasksContent()}</div>

        <section className={styles.deletedSection}>
          <h3 className={styles.deletedTitle}>削除済みタスク</h3>
          {deletedTasks.length === 0 ? (
            <EmptyState title="削除済みタスクはありません">
              <p>削除したタスクはここに残り、必要なときに復元できます。</p>
            </EmptyState>
          ) : (
            <div className={styles.deletedList}>
              {deletedTasks.map((task) => (
                <div key={task.id} className={styles.deletedItem}>
                  <div>
                    <h4>{task.title}</h4>
                    <p>
                      削除日:{' '}
                      {task.deletedAt
                        ? new Date(task.deletedAt).toLocaleDateString('ja-JP')
                        : '不明'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyTaskId === task.id}
                    onClick={() =>
                      void restoreTask(task.id).catch((error) => {
                        setLocalError(
                          error instanceof Error
                            ? error.message
                            : 'タスクの復元に失敗しました。',
                        );
                      })
                    }
                  >
                    復元
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <FAB aria-label="追加" onClick={() => setIsCreateSheetOpen(true)} />
      <TaskCreateSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        projectId={projectId}
      />
      <TaskEditSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        projectId={projectId}
        task={editingTask}
      />
    </>
  );
}
