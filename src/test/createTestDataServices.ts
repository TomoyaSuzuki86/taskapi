import type { DataServices } from '@/services/data-services';
import type {
  HistoryEntry,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from '@/types/domain';

type TestDataOptions = {
  projects?: Project[];
  deletedProjects?: Project[];
  projectById?: Record<string, Project | null>;
  tasksByProjectId?: Record<string, Task[]>;
  deletedTasksByProjectId?: Record<string, Task[]>;
  historyEntries?: HistoryEntry[];
  createProject?: (
    ownerUid: string,
    input: ProjectCreateInput,
  ) => Promise<string>;
  updateProject?: (
    ownerUid: string,
    projectId: string,
    input: ProjectUpdateInput,
  ) => Promise<void>;
  deleteProject?: (ownerUid: string, projectId: string) => Promise<void>;
  restoreProject?: (ownerUid: string, projectId: string) => Promise<void>;
  createTask?: (
    ownerUid: string,
    projectId: string,
    input: TaskCreateInput,
  ) => Promise<string>;
  updateTask?: (
    ownerUid: string,
    projectId: string,
    taskId: string,
    input: TaskUpdateInput,
  ) => Promise<void>;
  deleteTask?: (
    ownerUid: string,
    projectId: string,
    taskId: string,
  ) => Promise<void>;
  restoreTask?: (
    ownerUid: string,
    projectId: string,
    taskId: string,
  ) => Promise<void>;
};

export function createTestDataServices(
  options: TestDataOptions = {},
): DataServices {
  return {
    projectRepository: {
      subscribeProjects: (_ownerUid, onNext) => {
        onNext(options.projects ?? []);
        return () => undefined;
      },
      subscribeDeletedProjects: (_ownerUid, onNext) => {
        onNext(options.deletedProjects ?? []);
        return () => undefined;
      },
      subscribeProject: (_ownerUid, projectId, onNext) => {
        const project =
          options.projectById?.[projectId] ??
          options.projects?.find((item) => item.id === projectId) ??
          options.deletedProjects?.find((item) => item.id === projectId) ??
          null;
        onNext(project);
        return () => undefined;
      },
      createProject:
        options.createProject ??
        (async () => {
          return 'project-created';
        }),
      updateProject:
        options.updateProject ??
        (async (ownerUid, projectId, input) => {
          void ownerUid;
          void projectId;
          void input;
        }),
      deleteProject:
        options.deleteProject ??
        (async (ownerUid, projectId) => {
          void ownerUid;
          void projectId;
        }),
      restoreProject:
        options.restoreProject ??
        (async (ownerUid, projectId) => {
          void ownerUid;
          void projectId;
        }),
    },
    taskRepository: {
      subscribeTasks: (_ownerUid, projectId, onNext) => {
        onNext(options.tasksByProjectId?.[projectId] ?? []);
        return () => undefined;
      },
      subscribeDeletedTasks: (_ownerUid, projectId, onNext) => {
        onNext(options.deletedTasksByProjectId?.[projectId] ?? []);
        return () => undefined;
      },
      createTask:
        options.createTask ??
        (async (ownerUid, projectId, input) => {
          void ownerUid;
          void projectId;
          void input;
          return 'task-created';
        }),
      updateTask:
        options.updateTask ??
        (async (ownerUid, projectId, taskId, input) => {
          void ownerUid;
          void projectId;
          void taskId;
          void input;
        }),
      deleteTask:
        options.deleteTask ??
        (async (ownerUid, projectId, taskId) => {
          void ownerUid;
          void projectId;
          void taskId;
        }),
      restoreTask:
        options.restoreTask ??
        (async (ownerUid, projectId, taskId) => {
          void ownerUid;
          void projectId;
          void taskId;
        }),
    },
    historyRepository: {
      subscribeHistory: (_ownerUid, onNext) => {
        onNext(options.historyEntries ?? []);
        return () => undefined;
      },
    },
  };
}
