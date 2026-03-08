import type {
  HistoryEntry,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  Task,
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

export type ChangeTaskStatusMutationPayload = {
  projectId: string;
  taskId: string;
  status: Task['status'];
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
  projects: Project[];
}>;
export type GetProjectQueryResult = MutationResult<{
  project: Project | null;
}>;
export type ListTasksQueryResult = MutationResult<{
  tasks: Task[];
}>;
export type ListDeletedProjectsQueryResult = MutationResult<{
  projects: Project[];
}>;
export type ListDeletedTasksQueryResult = MutationResult<{
  tasks: Task[];
}>;
export type ListHistoryQueryResult = MutationResult<{
  entries: HistoryEntry[];
}>;

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

export type TaskapiMutationUseCaseName =
  | 'createProject'
  | 'updateProject'
  | 'deleteProject'
  | 'restoreProject'
  | 'createTask'
  | 'updateTask'
  | 'deleteTask'
  | 'restoreTask'
  | 'changeTaskStatus';

export type TaskapiQueryServiceName =
  | 'listProjects'
  | 'getProject'
  | 'listTasks'
  | 'listDeletedProjects'
  | 'listDeletedTasks'
  | 'listHistory';

export type TaskapiToolContractMap = {
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
  changeTaskStatus: {
    payload: ChangeTaskStatusMutationPayload;
    result: ChangeTaskStatusMutationResult;
  };
  listProjects: {
    payload: Record<string, never>;
    result: ListProjectsQueryResult;
  };
  getProject: {
    payload: ProjectMutationPayload;
    result: GetProjectQueryResult;
  };
  listTasks: {
    payload: ProjectMutationPayload;
    result: ListTasksQueryResult;
  };
  listDeletedProjects: {
    payload: Record<string, never>;
    result: ListDeletedProjectsQueryResult;
  };
  listDeletedTasks: {
    payload: ProjectMutationPayload;
    result: ListDeletedTasksQueryResult;
  };
  listHistory: {
    payload: Record<string, never>;
    result: ListHistoryQueryResult;
  };
};
