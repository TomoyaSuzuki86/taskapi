export function resolveTaskapiMcpUid(env: NodeJS.ProcessEnv = process.env) {
  const uid = env.TASKAPI_MCP_UID?.trim();

  if (!uid) {
    throw new Error(
      'TASKAPI_MCP_UID is required for the MCP server. Set it to the single-user owner uid.',
    );
  }

  return uid;
}

export function resolveTaskapiMcpHost(env: NodeJS.ProcessEnv = process.env) {
  const host = env.TASKAPI_MCP_HOST?.trim();

  return host && host.length > 0 ? host : '127.0.0.1';
}

export function resolveTaskapiMcpPath(env: NodeJS.ProcessEnv = process.env) {
  const path = env.TASKAPI_MCP_PATH?.trim();

  if (!path) {
    return '/mcp';
  }

  if (!path.startsWith('/')) {
    throw new Error(
      'TASKAPI_MCP_PATH must start with "/". Example: /mcp',
    );
  }

  return path;
}

export function resolveTaskapiMcpPort(env: NodeJS.ProcessEnv = process.env) {
  const rawPort = env.TASKAPI_MCP_PORT?.trim() || env.PORT?.trim() || '8787';
  const port = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `TASKAPI_MCP_PORT/PORT must be an integer between 1 and 65535. Received: ${rawPort}`,
    );
  }

  return port;
}

export function resolveTaskapiMcpPublicBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
) {
  const rawUrl = env.TASKAPI_MCP_PUBLIC_BASE_URL?.trim();

  if (!rawUrl) {
    return null;
  }

  const url = new URL(rawUrl);
  const isLocalhost =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (url.protocol !== 'https:' && !isLocalhost) {
    throw new Error(
      'TASKAPI_MCP_PUBLIC_BASE_URL must use https unless it targets localhost.',
    );
  }

  return url;
}

export function resolveTaskapiMcpOauthApprovalSecret(
  env: NodeJS.ProcessEnv = process.env,
) {
  const secret = env.TASKAPI_MCP_OAUTH_APPROVAL_SECRET?.trim();

  if (!secret) {
    return null;
  }

  if (secret.length < 16) {
    throw new Error(
      'TASKAPI_MCP_OAUTH_APPROVAL_SECRET must be at least 16 characters.',
    );
  }

  return secret;
}

export function resolveTaskapiMcpOauthTokenSecret(
  env: NodeJS.ProcessEnv = process.env,
) {
  const secret = env.TASKAPI_MCP_OAUTH_TOKEN_SECRET?.trim();

  if (!secret) {
    return null;
  }

  if (secret.length < 32) {
    throw new Error(
      'TASKAPI_MCP_OAUTH_TOKEN_SECRET must be at least 32 characters.',
    );
  }

  return secret;
}

export function isTaskapiMcpOAuthEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return Boolean(
    resolveTaskapiMcpPublicBaseUrl(env) &&
      resolveTaskapiMcpOauthApprovalSecret(env) &&
      resolveTaskapiMcpOauthTokenSecret(env),
  );
}
