import type {
  ProjectCreateInput,
  ProjectUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
} from './domain';

export const TASKAPI_WRITE_FUNCTIONS = {
  createProject: 'createProject',
  updateProject: 'updateProject',
  deleteProject: 'deleteProject',
  restoreProject: 'restoreProject',
  createTask: 'createTask',
  updateTask: 'updateTask',
  deleteTask: 'deleteTask',
  restoreTask: 'restoreTask',
} as const;

export type TaskapiWriteFunctionName = keyof typeof TASKAPI_WRITE_FUNCTIONS;

export type MutationErrorCode =
  | 'unauthenticated'
  | 'invalid-argument'
  | 'not-found'
  | 'failed-precondition'
  | 'internal';

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

export type UpdateProjectMutationPayload = ProjectUpdateInput & {
  projectId: string;
};

export type ProjectMutationPayload = {
  projectId: string;
};

export type CreateProjectMutationData = {
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

export type CreateTaskMutationPayload = TaskCreateInput & {
  projectId: string;
};

export type UpdateTaskMutationPayload = TaskUpdateInput & {
  projectId: string;
  taskId: string;
};

export type TaskMutationPayload = {
  projectId: string;
  taskId: string;
};

export type CreateTaskMutationData = {
  taskId: string;
};

export type CreateTaskMutationResult = MutationResult<CreateTaskMutationData>;
export type UpdateTaskMutationResult = MutationResult<MutationAcknowledgement>;
export type DeleteTaskMutationResult = MutationResult<MutationAcknowledgement>;
export type RestoreTaskMutationResult = MutationResult<MutationAcknowledgement>;

export type TaskapiWriteContractMap = {
  createProject: {
    payload: ProjectCreateInput;
    result: CreateProjectMutationResult;
  };
  updateProject: {
    payload: UpdateProjectMutationPayload;
    result: UpdateProjectMutationResult;
  };
  deleteProject: {
    payload: ProjectMutationPayload;
    result: DeleteProjectMutationResult;
  };
  restoreProject: {
    payload: ProjectMutationPayload;
    result: RestoreProjectMutationResult;
  };
  createTask: {
    payload: CreateTaskMutationPayload;
    result: CreateTaskMutationResult;
  };
  updateTask: {
    payload: UpdateTaskMutationPayload;
    result: UpdateTaskMutationResult;
  };
  deleteTask: {
    payload: TaskMutationPayload;
    result: DeleteTaskMutationResult;
  };
  restoreTask: {
    payload: TaskMutationPayload;
    result: RestoreTaskMutationResult;
  };
};
