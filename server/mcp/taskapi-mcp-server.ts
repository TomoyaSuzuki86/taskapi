import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TaskapiMutationUseCases } from '../../functions/src/application/taskapi-mutation-use-cases';
import type { TaskapiQueryService } from '../../functions/src/application/taskapi-query-service';
import type {
  ChangeTaskStatusMutationPayload,
  CreateTaskMutationPayload,
  MutationResult,
  ProjectCreateInput,
  ProjectMutationPayload,
  TaskMutationPayload,
  UpdateProjectMutationPayload,
  UpdateTaskMutationPayload,
} from '../../functions/src/domain/taskapi-contracts';
import * as taskapiContractsModule from '../../functions/src/domain/taskapi-contracts';
import * as taskapiValidationNamespace from '../../functions/src/domain/taskapi-validation';
import {
  acknowledgementResultSchema,
  changeTaskStatusInputSchema,
  createProjectInputSchema,
  createProjectResultSchema,
  createTaskInputSchema,
  createTaskResultSchema,
  getProjectResultSchema,
  listHistoryResultSchema,
  listProjectsResultSchema,
  listTasksResultSchema,
  projectMutationInputSchema,
  taskMutationInputSchema,
  updateProjectInputSchema,
  updateTaskInputSchema,
} from './taskapi-mcp-schemas';

type TaskapiMcpContext = {
  uid: string;
  mutationUseCases: Pick<
    TaskapiMutationUseCases,
    | 'createProject'
    | 'updateProject'
    | 'deleteProject'
    | 'restoreProject'
    | 'createTask'
    | 'updateTask'
    | 'deleteTask'
    | 'restoreTask'
    | 'changeTaskStatus'
  >;
  queryService: Pick<
    TaskapiQueryService,
    'listProjects' | 'getProject' | 'listTasks' | 'listHistory'
  >;
};

const taskapiValidationModule =
  'default' in taskapiValidationNamespace &&
  taskapiValidationNamespace.default &&
  typeof taskapiValidationNamespace.default === 'object'
    ? taskapiValidationNamespace.default
    : taskapiValidationNamespace;

const {
  validateChangeTaskStatusInput: safeValidateChangeTaskStatusInput,
  validateCreateProjectInput: safeValidateCreateProjectInput,
  validateCreateTaskInput: safeValidateCreateTaskInput,
  validateProjectMutationInput: safeValidateProjectMutationInput,
  validateTaskMutationInput: safeValidateTaskMutationInput,
  validateUpdateProjectInput: safeValidateUpdateProjectInput,
  validateUpdateTaskInput: safeValidateUpdateTaskInput,
} = taskapiValidationModule as {
  validateChangeTaskStatusInput: (
    data: unknown,
  ) => ChangeTaskStatusMutationPayload;
  validateCreateProjectInput: (data: unknown) => ProjectCreateInput;
  validateCreateTaskInput: (data: unknown) => CreateTaskMutationPayload;
  validateProjectMutationInput: (data: unknown) => ProjectMutationPayload;
  validateTaskMutationInput: (data: unknown) => TaskMutationPayload;
  validateUpdateProjectInput: (data: unknown) => UpdateProjectMutationPayload;
  validateUpdateTaskInput: (data: unknown) => UpdateTaskMutationPayload;
};

const taskapiContracts = (
  'default' in taskapiContractsModule &&
  taskapiContractsModule.default &&
  typeof taskapiContractsModule.default === 'object'
    ? taskapiContractsModule.default
    : taskapiContractsModule
) as typeof taskapiContractsModule;

export function createTaskapiMcpServer(context: TaskapiMcpContext) {
  const server = new McpServer({
    name: 'taskapi-mcp',
    version: '0.1.0',
  });

  server.registerTool(
    'list_projects',
    {
      description:
        'List active projects for the single configured taskapi user.',
      outputSchema: listProjectsResultSchema,
    },
    async () =>
      toMcpToolResult(
        await safeExecute(() => context.queryService.listProjects(context.uid)),
      ),
  );

  server.registerTool(
    'get_project',
    {
      description: 'Get one active project by id.',
      inputSchema: projectMutationInputSchema,
      outputSchema: getProjectResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.queryService.getProject(
            context.uid,
            safeValidateProjectMutationInput(args).projectId,
          ),
        ),
      ),
  );

  server.registerTool(
    'create_project',
    {
      description: 'Create a project.',
      inputSchema: createProjectInputSchema,
      outputSchema: createProjectResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.createProject(
            context.uid,
            safeValidateCreateProjectInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'update_project',
    {
      description: 'Update a project.',
      inputSchema: updateProjectInputSchema,
      outputSchema: acknowledgementResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.updateProject(
            context.uid,
            safeValidateUpdateProjectInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'delete_project',
    {
      description: 'Logically delete a project and its active tasks.',
      inputSchema: projectMutationInputSchema,
      outputSchema: acknowledgementResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.deleteProject(
            context.uid,
            safeValidateProjectMutationInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'restore_project',
    {
      description: 'Restore a logically deleted project.',
      inputSchema: projectMutationInputSchema,
      outputSchema: acknowledgementResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.restoreProject(
            context.uid,
            safeValidateProjectMutationInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'list_tasks',
    {
      description: 'List active tasks for a project.',
      inputSchema: projectMutationInputSchema,
      outputSchema: listTasksResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.queryService.listTasks(
            context.uid,
            safeValidateProjectMutationInput(args).projectId,
          ),
        ),
      ),
  );

  server.registerTool(
    'create_task',
    {
      description: 'Create a task under a project.',
      inputSchema: createTaskInputSchema,
      outputSchema: createTaskResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.createTask(
            context.uid,
            safeValidateCreateTaskInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'update_task',
    {
      description: 'Update a task.',
      inputSchema: updateTaskInputSchema,
      outputSchema: acknowledgementResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.updateTask(
            context.uid,
            safeValidateUpdateTaskInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'delete_task',
    {
      description: 'Logically delete a task.',
      inputSchema: taskMutationInputSchema,
      outputSchema: acknowledgementResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.deleteTask(
            context.uid,
            safeValidateTaskMutationInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'restore_task',
    {
      description: 'Restore a logically deleted task.',
      inputSchema: taskMutationInputSchema,
      outputSchema: acknowledgementResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.restoreTask(
            context.uid,
            safeValidateTaskMutationInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'change_task_status',
    {
      description: 'Change only the status of a task.',
      inputSchema: changeTaskStatusInputSchema,
      outputSchema: acknowledgementResultSchema,
    },
    async (args) =>
      toMcpToolResult(
        await safeExecute(() =>
          context.mutationUseCases.changeTaskStatus(
            context.uid,
            safeValidateChangeTaskStatusInput(args),
          ),
        ),
      ),
  );

  server.registerTool(
    'list_history',
    {
      description: 'List history entries for the configured taskapi user.',
      outputSchema: listHistoryResultSchema,
    },
    async () =>
      toMcpToolResult(
        await safeExecute(() => context.queryService.listHistory(context.uid)),
      ),
  );

  return server;
}

function toMcpToolResult<T extends Record<string, unknown>>(
  structuredContent: T,
) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
    structuredContent,
  };
}

async function safeExecute<T extends Record<string, unknown>>(
  run: () => Promise<MutationResult<T>>,
) {
  try {
    return await run();
  } catch (error) {
    return taskapiContracts.toFailureResult<T>(
      error,
      'The MCP tool failed unexpectedly.',
    );
  }
}
