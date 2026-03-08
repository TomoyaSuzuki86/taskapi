// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { TaskapiContractError } from '../domain/taskapi-contracts';
import {
  runAuthenticatedHandler,
  runAuthenticatedQuery,
} from './callable-handlers';

describe('callable handlers', () => {
  it('returns UNAUTHENTICATED for missing auth', async () => {
    const result = await runAuthenticatedQuery(
      {
        auth: null,
        data: {},
      } as never,
      async () => ({
        ok: true,
        data: { acknowledged: true },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'You must sign in before making changes.',
      },
    });
  });

  it('returns INVALID_ARGUMENT when payload validation fails', async () => {
    const result = await runAuthenticatedHandler(
      {
        auth: { uid: 'user-1' },
        data: null,
      } as never,
      () => {
        throw new TaskapiContractError(
          'INVALID_ARGUMENT',
          'Request payload must be a JSON object.',
        );
      },
      async () => ({
        ok: true,
        data: { acknowledged: true },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'INVALID_ARGUMENT',
        message: 'Request payload must be a JSON object.',
      },
    });
  });

  it('passes through shared failure results without rewrapping them', async () => {
    const result = await runAuthenticatedHandler(
      {
        auth: { uid: 'user-1' },
        data: { projectId: 'proj-1' },
      } as never,
      (data) => data as { projectId: string },
      async () => ({
        ok: false,
        error: {
          code: 'FAILED_PRECONDITION',
          message: 'Restore the parent project before changing its tasks.',
        },
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'FAILED_PRECONDITION',
        message: 'Restore the parent project before changing its tasks.',
      },
    });
  });
});
