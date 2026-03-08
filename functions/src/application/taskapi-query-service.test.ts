// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { TaskapiQueryService } from './taskapi-query-service';

function createQueryHarness() {
  const docs = new Map<string, Record<string, unknown> | undefined>();
  const collections = new Map<string, Array<Record<string, unknown>>>();

  const firestore = {
    doc(path: string) {
      return {
        async get() {
          const data = docs.get(path);

          return {
            exists: data !== undefined,
            data: () => data,
          };
        },
      };
    },
    collection(path: string) {
      return {
        orderBy() {
          return {
            async get() {
              return {
                docs: (collections.get(path) ?? []).map((data) => ({
                  data: () => data,
                })),
              };
            },
          };
        },
      };
    },
  };

  return {
    docs,
    collections,
    firestore,
  };
}

describe('TaskapiQueryService', () => {
  it('filters deleted projects from listProjects', async () => {
    const harness = createQueryHarness();
    harness.collections.set('users/user-1/projects', [
      {
        id: 'proj-1',
        ownerUid: 'user-1',
        name: 'Active',
        description: null,
        archived: false,
        deletedAt: null,
        createdAt: '2026-03-08T00:00:00.000Z',
        updatedAt: '2026-03-08T00:00:00.000Z',
      },
      {
        id: 'proj-2',
        ownerUid: 'user-1',
        name: 'Deleted',
        description: null,
        archived: false,
        deletedAt: '2026-03-08T00:00:00.000Z',
        createdAt: '2026-03-08T00:00:00.000Z',
        updatedAt: '2026-03-08T00:00:00.000Z',
      },
    ]);

    const service = new TaskapiQueryService(harness.firestore as never);
    const result = await service.listProjects('user-1');

    expect(result).toEqual({
      ok: true,
      data: {
        projects: [
          expect.objectContaining({
            id: 'proj-1',
            name: 'Active',
          }),
        ],
      },
    });
  });

  it('returns null for a missing project without throwing', async () => {
    const harness = createQueryHarness();
    const service = new TaskapiQueryService(harness.firestore as never);

    await expect(service.getProject('user-1', 'missing')).resolves.toEqual({
      ok: true,
      data: {
        project: null,
      },
    });
  });

  it('returns INTERNAL failure results when stored data cannot be mapped', async () => {
    const harness = createQueryHarness();
    harness.collections.set('users/user-1/history', [
      {
        id: 'hist-1',
        entityType: 'task',
        entityId: 'task-1',
        projectId: 'proj-1',
        action: 'update',
        title: 'Broken history',
        createdAt: Symbol('bad-timestamp'),
      },
    ]);

    const service = new TaskapiQueryService(harness.firestore as never);
    const result = await service.listHistory('user-1');

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'INTERNAL',
        message: 'Stored Firestore data is invalid at history.createdAt.',
      },
    });
  });
});
