import { isStorageProject } from '@/lib/tasks/storage-project';
import type { Project, Task } from '@/types/domain';

export const UNTAGGED_GROUP_KEY = '__no_tag__';
export const UNTAGGED_GROUP_LABEL = 'No tag';

export type TagTaskGroup = {
  key: string;
  label: string;
  tasks: Task[];
  openCount: number;
  totalCount: number;
};

export function normalizeTasksForDisplay(
  tasks: Task[],
  projectLookup: Map<string, Project>,
) {
  return sortTasksByDueDate(
    tasks.map((task) => ({
      ...task,
      tags: resolveTaskTags(task, projectLookup.get(task.projectId) ?? null),
    })),
  );
}

export function resolveTaskTags(task: Task, project: Project | null) {
  if (task.tags.length > 0) {
    return task.tags;
  }

  if (project && !isStorageProject(project.id)) {
    return [project.name];
  }

  return [];
}

export function buildTagTaskGroups(tasks: Task[]): TagTaskGroup[] {
  const groupedTasks = new Map<string, Task[]>();

  for (const task of tasks) {
    const labels = task.tags.length > 0 ? task.tags : [UNTAGGED_GROUP_LABEL];

    for (const label of labels) {
      const groupTasks = groupedTasks.get(label) ?? [];
      groupTasks.push(task);
      groupedTasks.set(label, groupTasks);
    }
  }

  return [...groupedTasks.entries()]
    .map(([label, groupTasks]) => ({
      key: label === UNTAGGED_GROUP_LABEL ? UNTAGGED_GROUP_KEY : label,
      label,
      tasks: sortTasksForBoard(groupTasks),
      openCount: groupTasks.filter((task) => task.status !== 'done').length,
      totalCount: groupTasks.length,
    }))
    .sort((left, right) => {
      const dueDiff =
        earliestOpenDueSortValue(left.tasks) - earliestOpenDueSortValue(right.tasks);

      if (dueDiff !== 0) {
        return dueDiff;
      }

      if (left.label === UNTAGGED_GROUP_LABEL) {
        return 1;
      }

      if (right.label === UNTAGGED_GROUP_LABEL) {
        return -1;
      }

      return left.label.localeCompare(right.label, 'ja-JP');
    });
}

export function sortTasksByDueDate(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const leftDue = toDueSortValue(left.dueDate);
    const rightDue = toDueSortValue(right.dueDate);

    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

export function sortTasksForBoard(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.status === 'done' && right.status !== 'done') {
      return 1;
    }

    if (left.status !== 'done' && right.status === 'done') {
      return -1;
    }

    const dueDiff = toDueSortValue(left.dueDate) - toDueSortValue(right.dueDate);
    if (dueDiff !== 0) {
      return dueDiff;
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

export function toDueDay(value: string | null) {
  if (!value) {
    return null;
  }

  return startOfDay(new Date(value).getTime());
}

export function startOfDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function toDayKey(value: string | Date | number | null) {
  if (!value) {
    return null;
  }

  const date =
    typeof value === 'string' || typeof value === 'number'
      ? new Date(value)
      : value;

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function earliestOpenDueSortValue(tasks: Task[]) {
  const openTasks = tasks.filter((task) => task.status !== 'done');

  if (openTasks.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(...openTasks.map((task) => toDueSortValue(task.dueDate)));
}

function toDueSortValue(value: string | null) {
  return toDueDay(value) ?? Number.POSITIVE_INFINITY;
}
