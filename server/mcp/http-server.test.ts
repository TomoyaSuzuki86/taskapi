// @vitest-environment node

import { createServer } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterEach, describe, expect, it } from 'vitest';
import type {
  GetProjectQueryResult,
  ListHistoryQueryResult,
  ListProjectsQueryResult,
  ListTasksQueryResult,
} from '../../functions/src/domain/taskapi-contracts';
import { createTaskapiMcpApp } from './http-server';
import { createTaskapiMcpServer } from './taskapi-mcp-server';

const serversToClose = new Set<ReturnType<typeof createServer>>();

afterEach(async () => {
  await Promise.all(
    [...serversToClose].map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        }),
    ),
  );
  serversToClose.clear();
});

describe('taskapi MCP HTTP server', () => {
  it('serves the MCP tool set over streamable HTTP', async () => {
    const url = await startHarnessServer();
    const transport = new StreamableHTTPClientTransport(new URL(`${url}/mcp`));
    const client = new Client({
      name: 'taskapi-mcp-http-test-client',
      version: '1.0.0',
    });

    await client.connect(transport);
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
  });

  it('exposes a health endpoint and rejects non-POST MCP requests', async () => {
    const url = await startHarnessServer();

    const healthResponse = await fetch(`${url}/health`);
    expect(healthResponse.status).toBe(200);
    await expect(healthResponse.json()).resolves.toEqual({
      ok: true,
      transport: 'streamable-http',
      path: '/mcp',
      oauthEnabled: false,
    });

    const invalidMethodResponse = await fetch(`${url}/mcp`);
    expect(invalidMethodResponse.status).toBe(405);
    await expect(invalidMethodResponse.json()).resolves.toMatchObject({
      jsonrpc: '2.0',
      error: {
        message: 'Method not allowed.',
      },
      id: null,
    });
  });

  it('supports repeated requests and custom MCP paths', async () => {
    const url = await startHarnessServer('/remote-mcp');
    const transport = new StreamableHTTPClientTransport(
      new URL(`${url}/remote-mcp`),
    );
    const client = new Client({
      name: 'taskapi-mcp-http-repeat-test-client',
      version: '1.0.0',
    });

    await client.connect(transport);

    const firstTools = await client.listTools();
    const secondTools = await client.listTools();

    expect(firstTools.tools).toHaveLength(secondTools.tools.length);
    expect(secondTools.tools.map((tool) => tool.name)).toContain('list_history');

    const defaultPathResponse = await fetch(`${url}/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    });
    expect(defaultPathResponse.status).toBe(404);

    await client.close();
  });
});

async function startHarnessServer(path = '/mcp') {
  const app = createTaskapiMcpApp({
    host: '127.0.0.1',
    path,
    ownerUid: 'user-1',
    oauthEnabled: false,
    serverFactory: () => createServerHarness().server,
  });
  const server = createServer(app);
  serversToClose.add(server);

  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve());
    server.once('error', reject);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine test server address.');
  }

  return `http://127.0.0.1:${address.port}`;
}

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
    server: createTaskapiMcpServer({
      uid: 'user-1',
      mutationUseCases,
      queryService,
    }),
  };
}
