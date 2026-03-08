import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageSkeleton } from '@/components/skeleton/PageSkeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { useProject } from '@/features/projects/useProject';
import { useProjectActions } from '@/features/projects/useProjectActions';
import { useTasks } from '@/features/tasks/useTasks';
import {
  formatDateLabel,
  formatProjectStateLabel,
  formatTaskStatusLabel,
} from '@/lib/ui/display';
import type { TaskStatus } from '@/types/domain';

const emptyTaskForm = {
  title: '',
  notes: '',
  status: 'todo' as TaskStatus,
  dueDate: '',
};

export function ProjectDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectId = '' } = useParams();
  const { deleteProject, updateProject, busyProjectId } = useProjectActions(
    user!.uid,
  );
  const { project, status, errorMessage } = useProject(user!.uid, projectId);
  const tasksState = useTasks(user!.uid, projectId);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    archived: false,
  });
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<
    Record<string, typeof emptyTaskForm>
  >({});
  const [localError, setLocalError] = useState<string | null>(null);

  const sortedTasks = useMemo(() => tasksState.tasks, [tasksState.tasks]);
  const deletedTasks = useMemo(
    () => tasksState.deletedTasks,
    [tasksState.deletedTasks],
  );

  useEffect(() => {
    if (!project) {
      return;
    }

    setProjectForm({
      name: project.name,
      description: project.description ?? '',
      archived: project.archived,
    });
  }, [project]);

  if (status === 'loading') {
    return <PageSkeleton />;
  }

  if (status === 'error') {
    return (
      <Card>
        <p className="section-heading__eyebrow">Project error</p>
        <h2>プロジェクトを読み込めませんでした</h2>
        <p className="muted-copy">{errorMessage}</p>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <p className="section-heading__eyebrow">Missing project</p>
        <h2>プロジェクトが見つかりません</h2>
        <p className="muted-copy">
          このプロジェクトは利用できないか、削除されています。
        </p>
        <Link className="text-link" to="/">
          ホームへ戻る
        </Link>
      </Card>
    );
  }

  const handleProjectSave = async () => {
    setLocalError(null);

    try {
      await updateProject(project.id, {
        name: projectForm.name,
        description: projectForm.description,
        archived: projectForm.archived,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'プロジェクトの更新に失敗しました。',
      );
    }
  };

  const handleProjectDelete = async () => {
    if (
      !window.confirm(
        'このプロジェクトを削除して、関連タスクを一覧から非表示にしますか？',
      )
    ) {
      return;
    }

    setLocalError(null);

    try {
      await deleteProject(project.id);
      navigate('/');
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'プロジェクトの削除に失敗しました。',
      );
    }
  };

  const handleTaskCreate = async () => {
    setLocalError(null);

    try {
      await tasksState.createTask(taskForm);
      setTaskForm(emptyTaskForm);
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'タスクの作成に失敗しました。',
      );
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!window.confirm('このタスクを削除しますか？')) {
      return;
    }

    setLocalError(null);

    try {
      await tasksState.deleteTask(taskId);
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'タスクの削除に失敗しました。',
      );
    }
  };

  const taskErrors = tasksState.errorMessage ?? localError;
  const canSaveProject = projectForm.name.trim().length > 0;
  const canCreateTask = taskForm.title.trim().length > 0;

  return (
    <div className="stack stack--page">
      <Card>
        <div className="section-heading page-intro">
          <div>
            <p className="section-heading__eyebrow">Project detail</p>
            <h2>{project.name}</h2>
            <p className="muted-copy">
              {project.description ?? '説明はまだありません。'}
            </p>
          </div>
          <span
            className={`pill ${project.archived ? 'pill--warning' : 'pill--ready'}`}
          >
            {formatProjectStateLabel(project.archived)}
          </span>
        </div>
        <div className="dashboard-metrics">
          <span className="pill">タスク {sortedTasks.length}件</span>
          <span className="pill">削除済み {deletedTasks.length}件</span>
          <span className="pill">
            更新日 {formatDateLabel(project.updatedAt)}
          </span>
        </div>
      </Card>

      <div className="dashboard-grid">
        <Card tone="muted">
          <div className="stack">
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Create task</p>
                <h3>新しいタスク</h3>
              </div>
            </div>
            <p className="muted-copy">
              まずは次に着手するタスクを追加します。必要な情報だけを短く入れておく運用に向いています。
            </p>
            <Input
              label="タスク名"
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
            <Textarea
              label="メモ"
              rows={3}
              value={taskForm.notes}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
            <div className="split-fields">
              <label className="field">
                <span className="field__label">ステータス</span>
                <select
                  className="field__input"
                  value={taskForm.status}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                >
                  <option value="todo">未着手</option>
                  <option value="doing">進行中</option>
                  <option value="done">完了</option>
                </select>
              </label>
              <Input
                label="期限"
                type="date"
                value={taskForm.dueDate}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
              />
            </div>
            <Button
              type="button"
              onClick={() => void handleTaskCreate()}
              disabled={tasksState.isCreating || !canCreateTask}
            >
              {tasksState.isCreating ? '作成中...' : 'タスクを追加'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="stack">
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Edit project</p>
                <h3>プロジェクト設定</h3>
              </div>
            </div>
            <Input
              label="プロジェクト名"
              value={projectForm.name}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <Textarea
              label="説明"
              rows={3}
              value={projectForm.description}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={projectForm.archived}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    archived: event.target.checked,
                  }))
                }
              />
              <span>アーカイブする</span>
            </label>
            <div className="button-row">
              <Button
                type="button"
                onClick={() => void handleProjectSave()}
                disabled={busyProjectId === project.id || !canSaveProject}
              >
                {busyProjectId === project.id ? '保存中...' : '保存する'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleProjectDelete()}
                disabled={busyProjectId === project.id}
              >
                プロジェクトを削除
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card tone="muted">
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Tasks</p>
            <h3>タスク一覧</h3>
          </div>
          <span className="pill">{sortedTasks.length}件</span>
        </div>
        {taskErrors ? (
          <p className="notice-inline" role="alert">
            {taskErrors}
          </p>
        ) : null}

        {tasksState.status === 'loading' ? (
          <PageSkeleton />
        ) : tasksState.status === 'error' ? (
          <p className="muted-copy">{tasksState.errorMessage}</p>
        ) : sortedTasks.length === 0 ? (
          <div className="empty-state">
            <h3>まだタスクがありません</h3>
            <p className="muted-copy">
              上のフォームから最初のタスクを追加してください。
            </p>
          </div>
        ) : (
          <div className="workspace-list">
            {sortedTasks.map((task) => {
              const draft = taskDrafts[task.id] ?? {
                title: task.title,
                notes: task.notes ?? '',
                status: task.status,
                dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
              };
              const isEditing = editingTaskId === task.id;
              const isBusy = tasksState.busyTaskId === task.id;
              const canSaveTask = draft.title.trim().length > 0;

              return (
                <Card key={task.id}>
                  <div className="workspace-row">
                    <div className="workspace-row__main">
                      <div className="workspace-row__topline">
                        <h3>{task.title}</h3>
                        <span className="pill">
                          {formatTaskStatusLabel(task.status)}
                        </span>
                      </div>
                      <p className="muted-copy">
                        {task.notes ?? 'メモはまだありません。'}
                      </p>
                      <p className="workspace-row__meta">
                        期限 {formatDateLabel(task.dueDate)}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="stack workspace-row__editor">
                        <Input
                          label="タスク名"
                          value={draft.title}
                          onChange={(event) =>
                            setTaskDrafts((current) => ({
                              ...current,
                              [task.id]: {
                                ...draft,
                                title: event.target.value,
                              },
                            }))
                          }
                        />
                        <Textarea
                          label="メモ"
                          rows={3}
                          value={draft.notes}
                          onChange={(event) =>
                            setTaskDrafts((current) => ({
                              ...current,
                              [task.id]: {
                                ...draft,
                                notes: event.target.value,
                              },
                            }))
                          }
                        />
                        <div className="split-fields">
                          <label className="field">
                            <span className="field__label">ステータス</span>
                            <select
                              className="field__input"
                              value={draft.status}
                              onChange={(event) =>
                                setTaskDrafts((current) => ({
                                  ...current,
                                  [task.id]: {
                                    ...draft,
                                    status: event.target.value as TaskStatus,
                                  },
                                }))
                              }
                            >
                              <option value="todo">未着手</option>
                              <option value="doing">進行中</option>
                              <option value="done">完了</option>
                            </select>
                          </label>
                          <Input
                            label="期限"
                            type="date"
                            value={draft.dueDate}
                            onChange={(event) =>
                              setTaskDrafts((current) => ({
                                ...current,
                                [task.id]: {
                                  ...draft,
                                  dueDate: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="button-row">
                          <Button
                            type="button"
                            onClick={() =>
                              void tasksState
                                .updateTask(task.id, draft)
                                .then(() => {
                                  setEditingTaskId(null);
                                })
                                .catch((error) => {
                                  setLocalError(
                                    error instanceof Error
                                      ? error.message
                                      : 'タスクの更新に失敗しました。',
                                  );
                                })
                            }
                            disabled={isBusy || !canSaveTask}
                          >
                            {isBusy ? '保存中...' : '保存する'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditingTaskId(null)}
                            disabled={isBusy}
                          >
                            キャンセル
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="button-row workspace-row__actions">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setTaskDrafts((current) => ({
                              ...current,
                              [task.id]: draft,
                            }));
                          }}
                        >
                          編集
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void handleTaskDelete(task.id)}
                          disabled={isBusy}
                        >
                          削除
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Deleted items</p>
            <h3>削除済みタスク</h3>
          </div>
          <span className="pill">{deletedTasks.length}件</span>
        </div>

        {deletedTasks.length === 0 ? (
          <div className="empty-state">
            <h3>削除済みタスクはありません</h3>
            <p className="muted-copy">
              削除したタスクはここに残り、必要なときに復元できます。
            </p>
          </div>
        ) : (
          <div className="workspace-list">
            {deletedTasks.map((task) => (
              <Card key={task.id}>
                <div className="workspace-row">
                  <div className="workspace-row__main">
                    <h3>{task.title}</h3>
                    <p className="workspace-row__meta">
                      削除日 {formatDateLabel(task.deletedAt)}
                    </p>
                  </div>
                  <div className="button-row workspace-row__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={tasksState.busyTaskId === task.id}
                      onClick={() =>
                        void tasksState.restoreTask(task.id).catch((error) => {
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
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
