// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  acknowledgementResultSchema,
  createProjectResultSchema,
} from './taskapi-mcp-schemas';

describe('taskapi MCP schemas', () => {
  it('accepts valid success and failure envelopes', () => {
    expect(
      createProjectResultSchema.safeParse({
        ok: true,
        data: {
          projectId: 'proj-1',
        },
      }).success,
    ).toBe(true);

    expect(
      createProjectResultSchema.safeParse({
        ok: false,
        error: {
          code: 'INVALID_ARGUMENT',
          message: 'name must be a non-empty string.',
        },
      }).success,
    ).toBe(true);
  });

  it('rejects mixed or incomplete envelopes', () => {
    expect(
      acknowledgementResultSchema.safeParse({
        ok: true,
        data: {
          acknowledged: true,
        },
        error: {
          code: 'INTERNAL',
          message: 'unexpected',
        },
      }).success,
    ).toBe(false);

    expect(
      acknowledgementResultSchema.safeParse({
        ok: false,
      }).success,
    ).toBe(false);

    expect(
      acknowledgementResultSchema.safeParse({
        ok: false,
        data: {
          acknowledged: true,
        },
      }).success,
    ).toBe(false);
  });
});
