import type {
  HistoryEntry,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from '@/types/domain';
import { createFirestoreHistoryRepository } from '@/services/firestore-history-repository';
import { createFirestoreProjectRepository } from '@/services/firestore-project-repository';
import { createFirestoreTaskRepository } from '@/services/firestore-task-repository';

export type Unsubscribe = () => void;

export type ProjectRepository = {
  subscribeProjects: (
    ownerUid: string,
    onNext: (projects: Project[]) => void,
    onError: (error: Error) => void,
  ) => Unsubscribe;
  subscribeDeletedProjects: (
    ownerUid: string,
    onNext: (projects: Project[]) => void,
    onError: (error: Error) => void,
  ) => Unsubscribe;
  subscribeProject: (
    ownerUid: string,
    projectId: string,
    onNext: (project: Project | null) => void,
    onError: (error: Error) => void,
  ) => Unsubscribe;
  createProject: (
    ownerUid: string,
    input: ProjectCreateInput,
  ) => Promise<string>;
  updateProject: (
    ownerUid: string,
    projectId: string,
    input: ProjectUpdateInput,
  ) => Promise<void>;
  deleteProject: (ownerUid: string, projectId: string) => Promise<void>;
  restoreProject: (ownerUid: string, projectId: string) => Promise<void>;
};

export type TaskRepository = {
  subscribeTasks: (
    ownerUid: string,
    projectId: string,
    onNext: (tasks: Task[]) => void,
    onError: (error: Error) => void,
  ) => Unsubscribe;
  subscribeDeletedTasks: (
    ownerUid: string,
    projectId: string,
    onNext: (tasks: Task[]) => void,
    onError: (error: Error) => void,
  ) => Unsubscribe;
  createTask: (
    ownerUid: string,
    projectId: string,
    input: TaskCreateInput,
  ) => Promise<string>;
  updateTask: (
    ownerUid: string,
    projectId: string,
    taskId: string,
    input: TaskUpdateInput,
  ) => Promise<void>;
  deleteTask: (
    ownerUid: string,
    projectId: string,
    taskId: string,
  ) => Promise<void>;
  restoreTask: (
    ownerUid: string,
    projectId: string,
    taskId: string,
  ) => Promise<void>;
};

export type HistoryRepository = {
  subscribeHistory: (
    ownerUid: string,
    onNext: (entries: HistoryEntry[]) => void,
    onError: (error: Error) => void,
  ) => Unsubscribe;
};

export type DataServices = {
  projectRepository: ProjectRepository;
  taskRepository: TaskRepository;
  historyRepository: HistoryRepository;
};

export function createFirestoreDataServices(): DataServices {
  return {
    projectRepository: createFirestoreProjectRepository(),
    taskRepository: createFirestoreTaskRepository(),
    historyRepository: createFirestoreHistoryRepository(),
  };
}

export type {
  Project,
  Task,
  ProjectCreateInput,
  ProjectUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
};
