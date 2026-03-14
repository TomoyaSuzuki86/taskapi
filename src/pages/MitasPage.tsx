import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Card } from '@/components/ui/Card';
import { FAB } from '@/components/ui/FAB';
import { useAuth } from '@/features/auth/useAuth';
import { MitasTaskRow } from '@/features/tasks/components/MitasTaskRow';
import { TaskCardSkeleton } from '@/features/tasks/components/TaskCardSkeleton';
import { TaskCreateSheet } from '@/features/tasks/components/TaskCreateSheet';
import { TaskDetailDialog } from '@/features/tasks/components/TaskDetailDialog';
import {
  buildTagTaskGroups,
  normalizeTasksForDisplay,
  sortTasksForBoard,
  toDayKey,
  UNTAGGED_GROUP_LABEL,
} from '@/features/tasks/task-presentation';
import { useOwnedTasks } from '@/features/tasks/useOwnedTasks';
import { useProjects } from '@/features/projects/useProjects';
import { useDataServices } from '@/services/useDataServices';
import type { Task, TaskStatus } from '@/types/domain';
import styles from './MitasPage.module.css';

type ViewMode = 'list' | 'calendar';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MitasPage() {
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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDayKey(new Date()));

  const boardStatus = projectsStatus === 'loading' ? 'loading' : tasksStatus;
  const boardErrorMessage =
    projectsStatus === 'error' ? projectsErrorMessage : tasksErrorMessage;

  const projectLookup = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const normalizedTasks = useMemo(
    () => normalizeTasksForDisplay(tasks, projectLookup),
    [projectLookup, tasks],
  );

  const tagGroups = useMemo(
    () => buildTagTaskGroups(normalizedTasks),
    [normalizedTasks],
  );

  const datedTasks = useMemo(
    () => normalizedTasks.filter((task) => task.dueDate),
    [normalizedTasks],
  );

  const tasksByDate = useMemo(() => {
    const nextMap = new Map<string, Task[]>();

    for (const task of datedTasks) {
      const dayKey = toDayKey(task.dueDate);
      if (!dayKey) {
        continue;
      }

      const dayTasks = nextMap.get(dayKey) ?? [];
      dayTasks.push(task);
      nextMap.set(dayKey, dayTasks);
    }

    for (const [dayKey, dayTasks] of nextMap) {
      nextMap.set(dayKey, sortTasksForBoard(dayTasks));
    }

    return nextMap;
  }, [datedTasks]);

  const dayKeysWithTasks = useMemo(
    () => new Set(tasksByDate.keys()),
    [tasksByDate],
  );

  const undatedTasks = useMemo(
    () => sortTasksForBoard(normalizedTasks.filter((task) => !task.dueDate)),
    [normalizedTasks],
  );

  const selectedDateTasks = useMemo(() => {
    if (!selectedDateKey) {
      return [];
    }

    return tasksByDate.get(selectedDateKey) ?? [];
  }, [selectedDateKey, tasksByDate]);

  const selectedDateLabel = selectedDateKey
    ? new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : 'Pick a day';

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

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  return (
    <>
      <div className={styles.page}>
        <Card>
          <div className={styles.hero}>
            <div>
              <p className={styles.kicker}>Mitas</p>
              <h1 className={styles.title}>Task board</h1>
            </div>
            <div className={styles.toggleRail} role="tablist" aria-label="View mode">
              <button
                type="button"
                className={`${styles.modeButton} ${viewMode === 'list' ? styles.modeButtonActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${viewMode === 'calendar' ? styles.modeButtonActive : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </button>
            </div>
          </div>
        </Card>

        {taskActionError ? (
          <div className={styles.notice} role="alert">
            <p>{taskActionError}</p>
          </div>
        ) : null}

        {boardStatus === 'loading' ? (
          <div className={styles.stack}>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        ) : boardStatus === 'error' ? (
          <div className={styles.notice}>
            <p>Failed to load tasks.</p>
            <p>{boardErrorMessage}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className={styles.stack}>
            {tagGroups.length === 0 ? (
              <Card>
                <EmptyState title="No tasks yet">
                  <p />
                </EmptyState>
              </Card>
            ) : (
              tagGroups.map((group) => {
                const isCollapsed = collapsedGroups[group.key] === true;

                return (
                  <Card key={group.key}>
                    <section className={styles.group}>
                      <button
                        type="button"
                        className={styles.groupHeader}
                        onClick={() => toggleGroup(group.key)}
                        aria-expanded={!isCollapsed}
                      >
                        <div>
                          <h2 className={styles.groupTitle}>
                            {group.label === UNTAGGED_GROUP_LABEL ? 'No tag' : `#${group.label}`}
                          </h2>
                          <p className={styles.groupMeta}>
                            {group.openCount} open / {group.totalCount} total
                          </p>
                        </div>
                        <span className={styles.groupToggle}>
                          {isCollapsed ? '+' : '-'}
                        </span>
                      </button>

                      {!isCollapsed ? (
                        <div className={styles.taskStack}>
                          {group.tasks.map((task) => (
                            <MitasTaskRow
                              key={`${group.key}-${task.id}`}
                              task={task}
                              disabled={busyTaskId === task.id}
                              onToggleStatus={handleToggleTaskStatus}
                              onOpen={(taskId) => {
                                const nextTask = normalizedTasks.find(
                                  (item) => item.id === taskId,
                                );
                                if (nextTask) {
                                  setEditingTask(nextTask);
                                }
                              }}
                            />
                          ))}
                        </div>
                      ) : null}
                    </section>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <div className={styles.calendarLayout}>
            <Card>
              <div className={styles.calendarHeader}>
                <button
                  type="button"
                  className={styles.monthButton}
                  onClick={() => setMonthAnchor(shiftMonth(monthAnchor, -1))}
                  aria-label="Previous month"
                >
                  Prev
                </button>
                <h2 className={styles.monthTitle}>
                  {monthAnchor.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </h2>
                <button
                  type="button"
                  className={styles.monthButton}
                  onClick={() => setMonthAnchor(shiftMonth(monthAnchor, 1))}
                  aria-label="Next month"
                >
                  Next
                </button>
              </div>

              <div className={styles.weekdays}>
                {weekdayLabels.map((label) => (
                  <span key={label} className={styles.weekday}>
                    {label}
                  </span>
                ))}
              </div>

              <div className={styles.calendarGrid}>
                {buildCalendarDays(monthAnchor).map((date) => {
                  const dayKey = toDayKey(date)!;
                  const isSelected = dayKey === selectedDateKey;
                  const isCurrentMonth = date.getMonth() === monthAnchor.getMonth();
                  const hasTasks = dayKeysWithTasks.has(dayKey);
                  const isToday = dayKey === toDayKey(new Date());

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      className={`${styles.dayButton} ${isSelected ? styles.dayButtonSelected : ''} ${!isCurrentMonth ? styles.dayButtonOutside : ''} ${isToday ? styles.dayButtonToday : ''}`}
                      onClick={() => setSelectedDateKey(dayKey)}
                      aria-label={date.toDateString()}
                    >
                      <span>{date.getDate()}</span>
                      <span
                        className={`${styles.dayDot} ${hasTasks ? styles.dayDotActive : ''}`}
                      />
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className={styles.stack}>
              <Card>
                <div className={styles.selectedHeader}>
                  <h2 className={styles.selectedTitle}>{selectedDateLabel}</h2>
                  <span className={styles.selectedCount}>{selectedDateTasks.length}</span>
                </div>

                {selectedDateTasks.length === 0 ? (
                  <EmptyState title="No tasks on this day">
                    <p />
                  </EmptyState>
                ) : (
                  <div className={styles.taskStack}>
                    {selectedDateTasks.map((task) => (
                      <MitasTaskRow
                        key={task.id}
                        task={task}
                        disabled={busyTaskId === task.id}
                        onToggleStatus={handleToggleTaskStatus}
                        onOpen={(taskId) => {
                          const nextTask = normalizedTasks.find((item) => item.id === taskId);
                          if (nextTask) {
                            setEditingTask(nextTask);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </Card>

              {undatedTasks.length > 0 ? (
                <Card>
                  <div className={styles.selectedHeader}>
                    <h2 className={styles.selectedTitle}>No date</h2>
                    <span className={styles.selectedCount}>{undatedTasks.length}</span>
                  </div>
                  <div className={styles.taskStack}>
                    {undatedTasks.map((task) => (
                      <MitasTaskRow
                        key={task.id}
                        task={task}
                        disabled={busyTaskId === task.id}
                        onToggleStatus={handleToggleTaskStatus}
                        onOpen={(taskId) => {
                          const nextTask = normalizedTasks.find((item) => item.id === taskId);
                          if (nextTask) {
                            setEditingTask(nextTask);
                          }
                        }}
                      />
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <FAB aria-label="Create task" onClick={() => setIsCreateSheetOpen(true)} />
      <TaskCreateSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />
      <TaskDetailDialog
        isOpen={editingTask !== null}
        onClose={() => setEditingTask(null)}
        task={editingTask}
      />
    </>
  );
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function shiftMonth(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function buildCalendarDays(monthAnchor: Date) {
  const firstDay = startOfMonth(monthAnchor);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}
