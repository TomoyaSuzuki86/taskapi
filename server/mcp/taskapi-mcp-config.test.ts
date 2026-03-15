// @vitest-environment node

import { describe, expect, it } from 'vitest';
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

describe('taskapi MCP config', () => {
  it('requires a configured uid', () => {
    expect(() => resolveTaskapiMcpUid({})).toThrow(
      /TASKAPI_MCP_UID is required/,
    );
  });

  it('uses sensible defaults for HTTP transport', () => {
    expect(resolveTaskapiMcpHost({})).toBe('127.0.0.1');
    expect(resolveTaskapiMcpPath({})).toBe('/mcp');
    expect(resolveTaskapiMcpPort({})).toBe(8787);
  });

  it('accepts explicit HTTP transport overrides', () => {
    expect(resolveTaskapiMcpHost({ TASKAPI_MCP_HOST: '0.0.0.0' })).toBe(
      '0.0.0.0',
    );
    expect(resolveTaskapiMcpPath({ TASKAPI_MCP_PATH: '/remote-mcp' })).toBe(
      '/remote-mcp',
    );
    expect(resolveTaskapiMcpPort({ TASKAPI_MCP_PORT: '9000' })).toBe(9000);
    expect(resolveTaskapiMcpPort({ PORT: '8080' })).toBe(8080);
  });

  it('rejects invalid HTTP transport configuration', () => {
    expect(() => resolveTaskapiMcpPath({ TASKAPI_MCP_PATH: 'mcp' })).toThrow(
      /must start with "\/"/,
    );
    expect(() => resolveTaskapiMcpPort({ TASKAPI_MCP_PORT: '0' })).toThrow(
      /must be an integer between 1 and 65535/,
    );
  });

  it('enables OAuth only when all auth settings exist', () => {
    const env = {
      TASKAPI_MCP_PUBLIC_BASE_URL: 'https://example.com',
      TASKAPI_MCP_OAUTH_APPROVAL_SECRET: 'approval-secret-1234',
      TASKAPI_MCP_OAUTH_TOKEN_SECRET:
        '0123456789abcdef0123456789abcdef',
    };

    expect(resolveTaskapiMcpPublicBaseUrl(env)?.href).toBe(
      'https://example.com/',
    );
    expect(resolveTaskapiMcpOauthApprovalSecret(env)).toBe(
      'approval-secret-1234',
    );
    expect(resolveTaskapiMcpOauthTokenSecret(env)).toBe(
      '0123456789abcdef0123456789abcdef',
    );
    expect(isTaskapiMcpOAuthEnabled(env)).toBe(true);
    expect(isTaskapiMcpOAuthEnabled({})).toBe(false);
  });
});
