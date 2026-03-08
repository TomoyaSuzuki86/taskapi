import { beforeEach, describe, expect, it, vi } from 'vitest';

const functionsMocks = vi.hoisted(() => ({
  getFirebaseFunctions: vi.fn(() => 'functions-instance'),
  httpsCallable: vi.fn(),
}));

vi.mock('@/lib/firebase/functions', () => ({
  getFirebaseFunctions: functionsMocks.getFirebaseFunctions,
}));

vi.mock('firebase/functions', async () => {
  const actual =
    await vi.importActual<typeof import('firebase/functions')>(
      'firebase/functions',
    );

  return {
    ...actual,
    httpsCallable: functionsMocks.httpsCallable,
  };
});

import { createTaskapiWriteApi } from '@/services/taskapi-write-api';

describe('createTaskapiWriteApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns callable success payloads', async () => {
    const callable = vi.fn(async () => ({
      data: {
        ok: true,
        data: {
          projectId: 'proj-123',
        },
      },
    }));
    functionsMocks.httpsCallable.mockReturnValue(callable);

    const api = createTaskapiWriteApi();
    const result = await api.createProject({
      name: 'Callable write',
      description: '',
    });

    expect(result).toEqual({ projectId: 'proj-123' });
    expect(callable).toHaveBeenCalledWith({
      name: 'Callable write',
      description: '',
    });
  });

  it('throws the server-provided message for callable failures', async () => {
    const callable = vi.fn(async () => ({
      data: {
        ok: false,
        error: {
          code: 'failed-precondition',
          message: 'Restore the parent project before changing its tasks.',
        },
      },
    }));
    functionsMocks.httpsCallable.mockReturnValue(callable);

    const api = createTaskapiWriteApi();

    await expect(
      api.restoreTask({
        projectId: 'proj-1',
        taskId: 'task-1',
      }),
    ).rejects.toThrow('Restore the parent project before changing its tasks.');
  });

  it('fails fast with a clear message when the browser is offline', async () => {
    const originalNavigator = window.navigator;
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      onLine: false,
    });

    const api = createTaskapiWriteApi();

    await expect(
      api.createProject({
        name: 'Offline write',
        description: '',
      }),
    ).rejects.toThrow(
      'You are offline. Reconnect before saving changes to taskapi.',
    );

    expect(functionsMocks.httpsCallable).not.toHaveBeenCalled();
    vi.stubGlobal('navigator', originalNavigator);
  });
});
