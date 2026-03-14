import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Card } from '@/components/ui/Card';
import { FAB } from '@/components/ui/FAB';
import { useAuth } from '@/features/auth/useAuth';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskCardSkeleton } from '@/features/tasks/components/TaskCardSkeleton';
import { TaskCreateSheet } from '@/features/tasks/components/TaskCreateSheet';
import { TaskEditSheet } from '@/features/tasks/components/TaskEditSheet';
import {
  normalizeTasksForDisplay,
  startOfDay,
  toDueDay,
} from '@/features/tasks/task-presentation';
import { useOwnedTasks } from '@/features/tasks/useOwnedTasks';
import { useProjects } from '@/features/projects/useProjects';
import { useDataServices } from '@/services/useDataServices';
import type { Task, TaskStatus } from '@/types/domain';
import styles from './BootstrapHomePage.module.css';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

type TaskBucket = 'today' | 'upcoming' | 'later';

export function BootstrapHomePage() {
  const { user } = useAuth();
  const { taskRepository } = useDataServices();
  const {
    projects,
    status: projectsStatus,
    errorMessage: projectsErrorMessage,
  } = useProjects(user!.uid);
  const projectIds = useMemo(() => projects.map((project) => project.id), [projects]);
  const {
    tasks,
    status: tasksStatus,
    errorMessage: tasksErrorMessage,
  } = useOwnedTasks(user!.uid, projectIds);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);

  const projectLookup = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const normalizedTasks = useMemo(
    () => normalizeTasksForDisplay(tasks, projectLookup),
    [projectLookup, tasks],
  );

  const openTasks = useMemo(
    () => normalizedTasks.filter((task) => task.status !== 'done'),
    [normalizedTasks],
  );

  const visibleTags = useMemo(() => {
    const uniqueTags = new Set<string>();

    for (const task of openTasks) {
      for (const tag of task.tags) {
        uniqueTags.add(tag);
      }
    }

    return [...uniqueTags].sort((left, right) => left.localeCompare(right, 'ja-JP'));
  }, [openTasks]);

  const filteredOpenTasks = useMemo(() => {
    if (!selectedTag) {
      return openTasks;
    }

    return openTasks.filter((task) => task.tags.includes(selectedTag));
  }, [openTasks, selectedTag]);

  const taskBuckets = useMemo(() => {
    const today = startOfDay(Date.now());
    const nextWeek = today + DAY_IN_MS * 7;

    return {
      today: filteredOpenTasks.filter((task) => {
        const dueAt = toDueDay(task.dueDate);
        return dueAt !== null && dueAt <= today;
      }),
      upcoming: filteredOpenTasks.filter((task) => {
        const dueAt = toDueDay(task.dueDate);
        return dueAt !== null && dueAt > today && dueAt < nextWeek;
      }),
      later: filteredOpenTasks.filter((task) => {
        const dueAt = toDueDay(task.dueDate);
        return dueAt === null || dueAt >= nextWeek;
      }),
    };
  }, [filteredOpenTasks]);

  const overview = useMemo(
    () => ({
      openCount: openTasks.length,
      doneCount: normalizedTasks.filter((task) => task.status === 'done').length,
      overdueCount: openTasks.filter((task) => {
        const dueAt = toDueDay(task.dueDate);
        return dueAt !== null && dueAt < startOfDay(Date.now());
      }).length,
    }),
    [normalizedTasks, openTasks],
  );

  const homeStatus = projectsStatus === 'loading' ? 'loading' : tasksStatus;
  const homeErrorMessage =
    projectsStatus === 'error' ? projectsErrorMessage : tasksErrorMessage;

  const handleToggleTaskStatus = async (
    taskId: string,
    nextStatus: TaskStatus,
  ) => {
    const task = normalizedTasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    setBusyTaskId(taskId);
    setTaskActionError(null);

    try {
      await taskRepository.updateTask(user!.uid, task.projectId, task.id, {
        title: task.title,
        notes: task.notes ?? '',
        tags: task.tags,
        status: nextStatus,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      });
    } catch (error) {
      setTaskActionError(
        error instanceof Error ? error.message : 'Failed to update task.',
      );
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <Card>
          <div className={styles.hero}>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <strong>{overview.openCount}</strong>
                <span>Open</span>
              </div>
              <div className={styles.metric}>
                <strong>{overview.overdueCount}</strong>
                <span>Overdue</span>
              </div>
              <div className={styles.metric}>
                <strong>{overview.doneCount}</strong>
                <span>Done</span>
              </div>
            </div>

            {visibleTags.length > 0 ? (
              <div className={styles.tagRail} aria-label="Tag filter">
                <button
                  type="button"
                  className={`${styles.tagFilter} ${selectedTag === null ? styles.tagFilterActive : ''}`}
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </button>
                {visibleTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.tagFilter} ${selectedTag === tag ? styles.tagFilterActive : ''}`}
                    onClick={() => setSelectedTag(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        {taskActionError ? (
          <div className={styles.notice} role="alert">
            <p>{taskActionError}</p>
          </div>
        ) : null}

        {renderTaskSection({
          title: 'Today',
          tasks: taskBuckets.today,
          status: homeStatus,
          errorMessage: homeErrorMessage,
          emptyTitle: selectedTag ? 'No tasks for this tag.' : 'No tasks for today.',
          busyTaskId,
          onToggleTaskStatus: handleToggleTaskStatus,
          onTaskClick: (taskId) => {
            const task = normalizedTasks.find((item) => item.id === taskId);
            if (task) {
              setEditingTask(task);
            }
          },
          tone: 'today',
        })}

        {renderTaskSection({
          title: 'Upcoming',
          tasks: taskBuckets.upcoming,
          status: homeStatus,
          errorMessage: homeErrorMessage,
          emptyTitle: selectedTag ? 'No tasks for this tag.' : 'No upcoming tasks.',
          busyTaskId,
          onToggleTaskStatus: handleToggleTaskStatus,
          onTaskClick: (taskId) => {
            const task = normalizedTasks.find((item) => item.id === taskId);
            if (task) {
              setEditingTask(task);
            }
          },
          tone: 'upcoming',
        })}

        {(taskBuckets.later.length > 0 || homeStatus !== 'ready') &&
          renderTaskSection({
            title: 'Later',
            tasks: taskBuckets.later,
            status: homeStatus,
            errorMessage: homeErrorMessage,
            emptyTitle: 'No later tasks.',
            busyTaskId,
            onToggleTaskStatus: handleToggleTaskStatus,
            onTaskClick: (taskId) => {
              const task = normalizedTasks.find((item) => item.id === taskId);
              if (task) {
                setEditingTask(task);
              }
            },
            tone: 'later',
          })}
      </div>

      <FAB aria-label="Create task" onClick={() => setIsCreateSheetOpen(true)} />
      <TaskCreateSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />
      <TaskEditSheet
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        task={editingTask}
      />
    </>
  );
}

type RenderTaskSectionArgs = {
  title: string;
  tasks: Task[];
  status: 'loading' | 'ready' | 'error';
  errorMessage: string | null;
  emptyTitle: string;
  busyTaskId: string | null;
  onToggleTaskStatus: (taskId: string, nextStatus: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
  tone: TaskBucket;
};

function renderTaskSection({
  title,
  tasks,
  status,
  errorMessage,
  emptyTitle,
  busyTaskId,
  onToggleTaskStatus,
  onTaskClick,
  tone,
}: RenderTaskSectionArgs) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {status === 'ready' ? (
          <span className={styles.sectionCount}>{tasks.length}</span>
        ) : null}
      </div>

      {status === 'loading' ? (
        <div className={styles.taskList}>
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      ) : status === 'error' ? (
        <div className={styles.notice}>
          <p>Failed to load tasks.</p>
          <p>{errorMessage}</p>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState title={emptyTitle}>
          <p />
        </EmptyState>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              meta={buildTaskMeta(task)}
              disabled={busyTaskId === task.id}
              onToggleStatus={onToggleTaskStatus}
              onClick={onTaskClick}
              tone={tone}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function buildTaskMeta(task: Task) {
  if (task.notes && task.notes.trim().length > 0) {
    return task.notes;
  }

  if (task.status === 'doing') {
    return 'Doing';
  }

  return undefined;
}
