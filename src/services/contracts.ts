import type { HistoryEntry, Project, Task } from '@/types/domain';

export interface ProjectReadService {
  listProjects(ownerUid: string): Promise<Project[]>;
  getProject(projectId: string, ownerUid: string): Promise<Project | null>;
}

export interface TaskReadService {
  listTasks(projectId: string, ownerUid: string): Promise<Task[]>;
}

export interface HistoryReadService {
  listHistory(ownerUid: string): Promise<HistoryEntry[]>;
}

export type TaskapiWriteService = Record<string, never>;
