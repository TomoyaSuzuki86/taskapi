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
        <h2>Project could not load</h2>
        <p className="muted-copy">{errorMessage}</p>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <p className="section-heading__eyebrow">Missing project</p>
        <h2>Project not found</h2>
        <p className="muted-copy">
          This project is unavailable or has been deleted.
        </p>
        <Link className="text-link" to="/">
          Return to home
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
        error instanceof Error ? error.message : 'Project update failed.',
      );
    }
  };

  const handleProjectDelete = async () => {
    if (
      !window.confirm('Delete this project and hide its tasks from the app?')
    ) {
      return;
    }

    setLocalError(null);

    try {
      await deleteProject(project.id);
      navigate('/');
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'Project delete failed.',
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
        error instanceof Error ? error.message : 'Task create failed.',
      );
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) {
      return;
    }

    setLocalError(null);

    try {
      await tasksState.deleteTask(taskId);
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'Task delete failed.',
      );
    }
  };

  const taskErrors = tasksState.errorMessage ?? localError;
  const canSaveProject = projectForm.name.trim().length > 0;
  const canCreateTask = taskForm.title.trim().length > 0;

  return (
    <div className="stack stack--page">
      <Card>
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Project detail</p>
            <h2>{project.name}</h2>
          </div>
          <span
            className={`pill ${project.archived ? 'pill--warning' : 'pill--ready'}`}
          >
            {project.archived ? 'Archived' : 'Active'}
          </span>
        </div>
        <p className="muted-copy">
          {project.description ?? 'No description yet.'}
        </p>
      </Card>

      <Card tone="muted">
        <div className="stack">
          <div className="section-heading">
            <div>
              <p className="section-heading__eyebrow">Edit project</p>
              <h3>Update project details</h3>
            </div>
          </div>
          <Input
            label="Project name"
            value={projectForm.name}
            onChange={(event) =>
              setProjectForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
          <Textarea
            label="Description"
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
            <span>Archive project</span>
          </label>
          <div className="button-row">
            <Button
              type="button"
              onClick={() => void handleProjectSave()}
              disabled={busyProjectId === project.id || !canSaveProject}
            >
              {busyProjectId === project.id ? 'Saving...' : 'Save project'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleProjectDelete()}
              disabled={busyProjectId === project.id}
            >
              Delete project
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="stack">
          <div className="section-heading">
            <div>
              <p className="section-heading__eyebrow">Create task</p>
              <h3>New task</h3>
            </div>
          </div>
          <Input
            label="Task title"
            value={taskForm.title}
            onChange={(event) =>
              setTaskForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
          <Textarea
            label="Notes"
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
              <span className="field__label">Status</span>
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
                <option value="todo">Todo</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
            </label>
            <Input
              label="Due date"
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
            {tasksState.isCreating ? 'Creating...' : 'Create task'}
          </Button>
        </div>
      </Card>

      <Card tone="muted">
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Tasks</p>
            <h3>Project task list</h3>
          </div>
          <span className="pill">{sortedTasks.length} items</span>
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
            <h3>No tasks yet</h3>
            <p className="muted-copy">
              Create the first task for this project above.
            </p>
          </div>
        ) : (
          <div className="stack">
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
                  <div className="stack stack--tight">
                    <div className="section-heading section-heading--compact">
                      <div>
                        <h3>{task.title}</h3>
                        <p className="muted-copy">
                          {task.notes ?? 'No notes yet.'}
                        </p>
                      </div>
                      <span className="pill">{task.status}</span>
                    </div>
                    <p className="muted-copy">
                      Due:{' '}
                      {task.dueDate ? task.dueDate.slice(0, 10) : 'Not set'}
                    </p>

                    {isEditing ? (
                      <div className="stack">
                        <Input
                          label="Task title"
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
                          label="Notes"
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
                            <span className="field__label">Status</span>
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
                              <option value="todo">Todo</option>
                              <option value="doing">Doing</option>
                              <option value="done">Done</option>
                            </select>
                          </label>
                          <Input
                            label="Due date"
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
                                      : 'Task update failed.',
                                  );
                                })
                            }
                            disabled={isBusy || !canSaveTask}
                          >
                            {isBusy ? 'Saving...' : 'Save task'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditingTaskId(null)}
                            disabled={isBusy}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="button-row">
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
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void handleTaskDelete(task.id)}
                          disabled={isBusy}
                        >
                          Delete
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
            <h3>Restore tasks</h3>
          </div>
          <span className="pill">{deletedTasks.length} deleted</span>
        </div>

        {deletedTasks.length === 0 ? (
          <div className="empty-state">
            <h3>No deleted tasks</h3>
            <p className="muted-copy">
              Deleted tasks for this project will appear here until restored.
            </p>
          </div>
        ) : (
          <div className="stack">
            {deletedTasks.map((task) => (
              <Card key={task.id}>
                <div className="section-heading section-heading--compact">
                  <div>
                    <h3>{task.title}</h3>
                    <p className="muted-copy">
                      Deleted {task.deletedAt?.slice(0, 10)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={tasksState.busyTaskId === task.id}
                    onClick={() =>
                      void tasksState.restoreTask(task.id).catch((error) => {
                        setLocalError(
                          error instanceof Error
                            ? error.message
                            : 'Task restore failed.',
                        );
                      })
                    }
                  >
                    Restore
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
