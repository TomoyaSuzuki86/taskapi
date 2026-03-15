import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getOAuthProtectedResourceMetadataUrl, mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAdminFirestore } from '../api/firebase-admin';
import {
  isTaskapiMcpOAuthEnabled,
  resolveTaskapiMcpHost,
  resolveTaskapiMcpOauthApprovalSecret,
  resolveTaskapiMcpOauthTokenSecret,
  resolveTaskapiMcpPath,
  resolveTaskapiMcpPort,
  resolveTaskapiMcpPublicBaseUrl,
  resolveTaskapiMcpUid,
} from './taskapi-mcp-config';
import {
  renderApprovalPageHtml,
  TaskapiMcpOAuthProvider,
} from './taskapi-mcp-oauth-provider';
import { createTaskapiMcpRuntimeForUid } from './taskapi-mcp-runtime';

type TaskapiMcpHttpAppOptions = {
  env?: NodeJS.ProcessEnv;
  host?: string;
  path?: string;
  oauthEnabled?: boolean;
  oauthProvider?: TaskapiMcpOAuthProvider;
  publicBaseUrl?: URL | null;
  ownerUid?: string;
  serverFactory?: (uid: string) => McpServer;
};

export function createTaskapiMcpApp(options: TaskapiMcpHttpAppOptions = {}) {
  const env = options.env ?? process.env;
  const host = options.host ?? resolveTaskapiMcpHost(env);
  const path = options.path ?? resolveTaskapiMcpPath(env);
  const ownerUid = options.ownerUid ?? resolveTaskapiMcpUid(env);
  const oauthEnabled = options.oauthEnabled ?? isTaskapiMcpOAuthEnabled(env);
  const publicBaseUrl =
    options.publicBaseUrl ?? resolveTaskapiMcpPublicBaseUrl(env);
  const app = createMcpExpressApp({ host });
  const serverFactory =
    options.serverFactory ?? ((uid: string) => createTaskapiMcpRuntimeForUid(uid));

  let oauthProvider = options.oauthProvider;

  if (oauthEnabled) {
    if (!publicBaseUrl) {
      throw new Error(
        'TASKAPI_MCP_PUBLIC_BASE_URL is required when OAuth is enabled.',
      );
    }

    oauthProvider ??= new TaskapiMcpOAuthProvider({
      firestore: getAdminFirestore(),
      issuerUrl: publicBaseUrl,
      resourceServerUrl: new URL(path, publicBaseUrl),
      ownerUid,
      approvalSecret: resolveTaskapiMcpOauthApprovalSecret(env)!,
      tokenSecret: resolveTaskapiMcpOauthTokenSecret(env)!,
    });
    const enabledOauthProvider = oauthProvider;

    const resourceServerUrl = new URL(path, publicBaseUrl);
    const resourceMetadataUrl =
      getOAuthProtectedResourceMetadataUrl(resourceServerUrl);

    app.use(
      mcpAuthRouter({
        provider: oauthProvider,
        issuerUrl: publicBaseUrl,
        resourceServerUrl,
        scopesSupported: ['mcp:tools'],
        resourceName: 'taskapi MCP',
        authorizationOptions: { rateLimit: false },
        clientRegistrationOptions: { rateLimit: false },
        tokenOptions: { rateLimit: false },
      }),
    );

    app.get('/oauth/approve', async (req, res) => {
      const requestId =
        typeof req.query.request === 'string' ? req.query.request : '';

      try {
        const request =
          await enabledOauthProvider.getPendingAuthorizationRequest(requestId);
        res
          .status(200)
          .type('html')
          .send(
            renderApprovalPageHtml({
              requestId,
              clientName: request.clientName,
              scopes: request.scopes,
            }),
          );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Authorization failed.';
        res
          .status(400)
          .type('html')
          .send(
            renderApprovalPageHtml({
              requestId,
              clientName: null,
              scopes: ['mcp:tools'],
              errorMessage: message,
            }),
          );
      }
    });

    app.post('/oauth/approve', async (req, res) => {
      const requestId =
        typeof req.body.requestId === 'string' ? req.body.requestId : '';
      const approvalSecret =
        typeof req.body.approvalSecret === 'string'
          ? req.body.approvalSecret
          : '';

      try {
        const result = await enabledOauthProvider.completeAuthorization(
          requestId,
          approvalSecret,
        );
        res.status(200).json({ redirectTo: result.redirectTo });
      } catch (error) {
        res.status(401).json({
          error: error instanceof Error ? error.message : 'Authorization failed.',
        });
      }
    });

    app.use(
      path,
      requireBearerAuth({
        verifier: enabledOauthProvider,
        requiredScopes: ['mcp:tools'],
        resourceMetadataUrl,
      }),
    );
  }

  app.get('/health', (_req, res) => {
    writeJson(res, 200, {
      ok: true,
      transport: 'streamable-http',
      path,
      oauthEnabled,
    });
  });

  app.post(path, async (req, res) => {
    const uid = oauthEnabled
      ? readAuthenticatedUid(req.auth?.extra?.uid)
      : ownerUid;
    const server = serverFactory(uid);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('taskapi MCP HTTP request failed:', error);

      if (!res.headersSent) {
        writeJsonRpcError(res, 500, 'Internal server error.');
      }
    } finally {
      await transport.close();
      await server.close();
    }
  });

  app.all(path, (_req, res) => {
    writeJsonRpcError(res, 405, 'Method not allowed.');
  });

  app.use((_req, res) => {
    writeJson(res, 404, {
      ok: false,
      error: 'Not found.',
    });
  });

  return app;
}

export function createTaskapiMcpHttpServer(
  options: TaskapiMcpHttpAppOptions = {},
) {
  return createServer(createTaskapiMcpApp(options));
}

async function main() {
  const host = resolveTaskapiMcpHost();
  const port = resolveTaskapiMcpPort();
  const path = resolveTaskapiMcpPath();
  const oauthEnabled = isTaskapiMcpOAuthEnabled();
  const publicBaseUrl = resolveTaskapiMcpPublicBaseUrl();
  const server = createTaskapiMcpHttpServer({
    host,
    path,
    oauthEnabled,
    publicBaseUrl,
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  }).catch((error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'EADDRINUSE'
    ) {
      throw new Error(
        `Port ${port} is already in use on ${host}. Set TASKAPI_MCP_PORT or PORT to a different value before starting the HTTP MCP server.`,
      );
    }

    throw error;
  });

  console.error(
    `taskapi MCP server running on http://${host}:${port}${path} (health: /health, oauth: ${oauthEnabled ? 'enabled' : 'disabled'})`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('taskapi MCP HTTP server failed:', error);
    process.exit(1);
  });
}

function readAuthenticatedUid(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Authenticated MCP requests must include a uid.');
  }

  return value;
}

function writeJson(
  res: {
    status: (statusCode: number) => { json: (payload: Record<string, unknown>) => void };
  },
  statusCode: number,
  payload: Record<string, unknown>,
) {
  res.status(statusCode).json(payload);
}

function writeJsonRpcError(
  res: {
    status: (statusCode: number) => { json: (payload: Record<string, unknown>) => void };
  },
  statusCode: number,
  message: string,
) {
  writeJson(res, statusCode, {
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message,
    },
    id: null,
  });
}
