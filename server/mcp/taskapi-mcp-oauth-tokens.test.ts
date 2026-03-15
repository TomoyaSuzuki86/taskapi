// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  issueTaskapiMcpToken,
  verifyTaskapiMcpToken,
} from './taskapi-mcp-oauth-tokens';

describe('taskapi MCP OAuth tokens', () => {
  it('issues and verifies access tokens', () => {
    const secret = '0123456789abcdef0123456789abcdef';
    const token = issueTaskapiMcpToken({
      issuer: 'https://example.com',
      audience: 'https://example.com/mcp',
      subject: 'user-1',
      clientId: 'client-1',
      scope: 'mcp:tools',
      type: 'access',
      lifetimeSeconds: 3600,
      secret,
      now: 1_700_000_000,
    });

    expect(
      verifyTaskapiMcpToken({
        token,
        expectedType: 'access',
        issuer: 'https://example.com',
        audience: 'https://example.com/mcp',
        secret,
        now: 1_700_000_100,
      }),
    ).toMatchObject({
      sub: 'user-1',
      client_id: 'client-1',
      scope: 'mcp:tools',
      type: 'access',
    });
  });

  it('rejects tokens with the wrong audience', () => {
    const secret = '0123456789abcdef0123456789abcdef';
    const token = issueTaskapiMcpToken({
      issuer: 'https://example.com',
      audience: 'https://example.com/mcp',
      subject: 'user-1',
      clientId: 'client-1',
      scope: 'mcp:tools',
      type: 'refresh',
      lifetimeSeconds: 3600,
      secret,
      now: 1_700_000_000,
    });

    expect(() =>
      verifyTaskapiMcpToken({
        token,
        expectedType: 'refresh',
        issuer: 'https://example.com',
        audience: 'https://example.com/other',
        secret,
        now: 1_700_000_100,
      }),
    ).toThrow(/Unexpected token audience/);
  });
});
