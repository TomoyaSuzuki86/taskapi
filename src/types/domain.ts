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
  description: string | null;
  archived: boolean;
  deletedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};

export type ProjectCreateInput = {
  name: string;
  description: string;
};

export type ProjectUpdateInput = {
  name: string;
  description: string;
  archived: boolean;
};

export type TaskStatus = 'todo' | 'doing' | 'done';

export type Task = {
  id: EntityId;
  projectId: EntityId;
  ownerUid: string;
  title: string;
  notes: string | null;
  tags: string[];
  status: TaskStatus;
  dueDate: IsoTimestamp | null;
  completedAt: IsoTimestamp | null;
  deletedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};

export type TaskCreateInput = {
  title: string;
  notes: string;
  tags: string[];
  status: TaskStatus;
  dueDate: string;
};

export type TaskUpdateInput = {
  title: string;
  notes: string;
  tags: string[];
  status: TaskStatus;
  dueDate: string;
};

export type HistoryAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'status_change';
export type HistoryEntityType = 'project' | 'task';

export type HistoryEntry = {
  id: EntityId;
  entityType: HistoryEntityType;
  entityId: EntityId;
  projectId: EntityId | null;
  action: HistoryAction;
  title: string;
  createdAt: IsoTimestamp;
};
