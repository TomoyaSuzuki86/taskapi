export type EntityId = string;
export type IsoTimestamp = string;

export type TaskapiUser = {
  uid: string;
  email: string;
  displayName: string | null;
};

export type Project = {
  id: EntityId;
  ownerUid: string;
  name: string;
  description: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  deleted: boolean;
  version: number;
};

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: EntityId;
  projectId: EntityId;
  ownerUid: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  deleted: boolean;
  version: number;
};

export type HistoryAction = 'create' | 'update' | 'delete' | 'restore';
export type HistoryEntityType = 'project' | 'task';

export type HistoryEntry = {
  id: EntityId;
  ownerUid: string;
  entityType: HistoryEntityType;
  entityId: EntityId;
  projectId: EntityId | null;
  action: HistoryAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  revision: number;
  changedAt: IsoTimestamp;
  changedBy: string;
};
