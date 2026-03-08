// @vitest-environment node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import type {
  GetProjectQueryResult,
  ListHistoryQueryResult,
  ListProjectsQueryResult,
  ListTasksQueryResult,
} from '../../functions/src/domain/taskapi-contracts';
import { createTaskapiMcpServer } from './taskapi-mcp-server';

function createServerHarness() {
  const mutationUseCases = {
    createProject: async () => ({
      ok: true as const,
      data: { projectId: 'proj-1' },
    }),
    updateProject: async () => ({
      ok: true as const,
      data: { acknowledged: true as const },
    }),
    deleteProject: async () => ({
      ok: true as const,
      data: { acknowledged: true as const },
    }),
    restoreProject: async () => ({
      ok: true as const,
      data: { acknowledged: true as const },
    }),
    createTask: async () => ({
      ok: true as const,
      data: { taskId: 'task-1' },
    }),
    updateTask: async () => ({
      ok: true as const,
      data: { acknowledged: true as const },
    }),
    deleteTask: async () => ({
      ok: true as const,
      data: { acknowledged: true as const },
    }),
    restoreTask: async () => ({
      ok: true as const,
      data: { acknowledged: true as const },
    }),
    changeTaskStatus: async () => ({
      ok: true as const,
      data: { acknowledged: true as const },
    }),
  };

  const queryService: {
    listProjects: () => Promise<ListProjectsQueryResult>;
    getProject: () => Promise<GetProjectQueryResult>;
    listTasks: () => Promise<ListTasksQueryResult>;
    listHistory: () => Promise<ListHistoryQueryResult>;
  } = {
    listProjects: async () => ({
      ok: true as const,
      data: { projects: [] },
    }),
    getProject: async () => ({
      ok: true as const,
      data: { project: null },
    }),
    listTasks: async () => ({
      ok: true as const,
      data: { tasks: [] },
    }),
    listHistory: async () => ({
      ok: true as const,
      data: { entries: [] },
    }),
  };

  return {
    mutationUseCases,
    queryService,
    server: createTaskapiMcpServer({
      uid: 'user-1',
      mutationUseCases,
      queryService,
    }),
  };
}

describe('taskapi MCP server', () => {
  it('registers the required snake_case tool set', async () => {
    const harness = createServerHarness();
    const client = new Client({
      name: 'taskapi-mcp-test-client',
      version: '1.0.0',
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await harness.server.connect(serverTransport);
    await client.connect(clientTransport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        'list_projects',
        'get_project',
        'create_project',
        'update_project',
        'delete_project',
        'restore_project',
        'list_tasks',
        'create_task',
        'update_task',
        'delete_task',
        'restore_task',
        'change_task_status',
        'list_history',
      ]),
    );

    await client.close();
    await harness.server.close();
  });

  it('returns the shared machine-readable result envelope as structured content', async () => {
    const harness = createServerHarness();
    const client = new Client({
      name: 'taskapi-mcp-test-client',
      version: '1.0.0',
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await harness.server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: 'create_project',
      arguments: {
        name: 'Project from MCP',
        description: '',
      },
    });

    const structuredContent = readStructuredContent(result);
    expect(structuredContent).toEqual({
      ok: true,
      data: {
        projectId: 'proj-1',
      },
    });

    await client.close();
    await harness.server.close();
  });

  it('uses shared validation for MCP transport input errors', async () => {
    const harness = createServerHarness();
    let called = false;
    harness.mutationUseCases.createTask = async () => {
      called = true;
      return {
        ok: true as const,
        data: { taskId: 'task-1' },
      };
    };

    const client = new Client({
      name: 'taskapi-mcp-test-client',
      version: '1.0.0',
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await harness.server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: 'create_task',
      arguments: {
        projectId: 'proj-1',
        title: '',
        notes: '',
        status: 'todo',
        dueDate: 'not-a-date',
      },
    });

    expect(called).toBe(false);
    const structuredContent = readStructuredContent(result);
    expect(structuredContent).toEqual({
      ok: false,
      error: {
        code: 'INVALID_ARGUMENT',
        message: 'title must be a non-empty string.',
      },
    });

    await client.close();
    await harness.server.close();
  });

  it('passes through shared query failures unchanged', async () => {
    const harness = createServerHarness();
    harness.queryService.listHistory = async () => ({
      ok: false as const,
      error: {
        code: 'INTERNAL',
        message: 'History query failed.',
      },
    });

    const client = new Client({
      name: 'taskapi-mcp-test-client',
      version: '1.0.0',
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await harness.server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: 'list_history',
      arguments: {},
    });

    const structuredContent = readStructuredContent(result);
    expect(structuredContent).toEqual({
      ok: false,
      error: {
        code: 'INTERNAL',
        message: 'History query failed.',
      },
    });

    await client.close();
    await harness.server.close();
  });
});

function readStructuredContent(result: unknown) {
  if (typeof result === 'object' && result !== null) {
    const record = result as Record<string, unknown>;

    if (
      'structuredContent' in record &&
      typeof record.structuredContent === 'object' &&
      record.structuredContent !== null
    ) {
      return record.structuredContent as Record<string, unknown>;
    }

    const textContent = Array.isArray(record.content)
      ? record.content[0]
      : null;
    if (
      textContent &&
      typeof textContent === 'object' &&
      'text' in textContent &&
      typeof textContent.text === 'string'
    ) {
      return JSON.parse(textContent.text) as Record<string, unknown>;
    }
  }

  throw new Error('MCP tool result did not include machine-readable content.');
}
