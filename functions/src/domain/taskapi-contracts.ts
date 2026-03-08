export type MutationErrorCode =
  | 'UNAUTHENTICATED'
  | 'PERMISSION_DENIED'
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'FAILED_PRECONDITION'
  | 'INTERNAL';

export type MutationError = {
  code: MutationErrorCode;
  message: string;
};

export type MutationSuccess<T> = {
  ok: true;
  data: T;
};

export type MutationFailure = {
  ok: false;
  error: MutationError;
};

export type MutationResult<T> = MutationSuccess<T> | MutationFailure;

export type MutationAcknowledgement = {
  acknowledged: true;
};

export type TaskStatus = 'todo' | 'doing' | 'done';

export type TaskapiProject = {
  id: string;
  ownerUid: string;
  name: string;
  description: string | null;
  archived: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskapiTask = {
  id: string;
  ownerUid: string;
  projectId: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskapiHistoryEntry = {
  id: string;
  entityType: 'project' | 'task';
  entityId: string;
  projectId: string | null;
  action: 'create' | 'update' | 'delete' | 'restore' | 'status_change';
  title: string;
  createdAt: string;
};

export type ProjectCreateInput = {
  name: string;
  description: string;
};

export type CreateProjectMutationData = {
  projectId: string;
};

export type UpdateProjectMutationPayload = ProjectCreateInput & {
  projectId: string;
  archived: boolean;
};

export type ProjectMutationPayload = {
  projectId: string;
};

export type CreateProjectMutationResult =
  MutationResult<CreateProjectMutationData>;
export type UpdateProjectMutationResult =
  MutationResult<MutationAcknowledgement>;
export type DeleteProjectMutationResult =
  MutationResult<MutationAcknowledgement>;
export type RestoreProjectMutationResult =
  MutationResult<MutationAcknowledgement>;

export type CreateTaskMutationPayload = {
  projectId: string;
  title: string;
  notes: string;
  status: TaskStatus;
  dueDate: string;
};

export type UpdateTaskMutationPayload = CreateTaskMutationPayload & {
  taskId: string;
};

export type TaskMutationPayload = {
  projectId: string;
  taskId: string;
};

export type ChangeTaskStatusMutationPayload = {
  projectId: string;
  taskId: string;
  status: TaskStatus;
};

export type CreateTaskMutationData = {
  taskId: string;
};

export type CreateTaskMutationResult = MutationResult<CreateTaskMutationData>;
export type UpdateTaskMutationResult = MutationResult<MutationAcknowledgement>;
export type DeleteTaskMutationResult = MutationResult<MutationAcknowledgement>;
export type RestoreTaskMutationResult = MutationResult<MutationAcknowledgement>;
export type ChangeTaskStatusMutationResult =
  MutationResult<MutationAcknowledgement>;

export type ListProjectsQueryResult = MutationResult<{
  projects: TaskapiProject[];
}>;

export type GetProjectQueryResult = MutationResult<{
  project: TaskapiProject | null;
}>;

export type ListTasksQueryResult = MutationResult<{
  tasks: TaskapiTask[];
}>;

export type ListDeletedProjectsQueryResult = MutationResult<{
  projects: TaskapiProject[];
}>;

export type ListDeletedTasksQueryResult = MutationResult<{
  tasks: TaskapiTask[];
}>;

export type ListHistoryQueryResult = MutationResult<{
  entries: TaskapiHistoryEntry[];
}>;

export class TaskapiContractError extends Error {
  readonly code: MutationErrorCode;

  constructor(code: MutationErrorCode, message: string) {
    super(message);
    this.name = 'TaskapiContractError';
    this.code = code;
  }
}

export function success<T>(data: T): MutationResult<T> {
  return {
    ok: true,
    data,
  };
}

export function failure<T>(
  code: MutationErrorCode,
  message: string,
): MutationResult<T> {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

export function toFailureResult<T>(
  error: unknown,
  fallbackMessage = 'The request failed unexpectedly.',
): MutationResult<T> {
  if (error instanceof TaskapiContractError) {
    return failure<T>(error.code, error.message);
  }

  return failure<T>('INTERNAL', fallbackMessage);
}
