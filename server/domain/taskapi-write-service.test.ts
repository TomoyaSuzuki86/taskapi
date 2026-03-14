import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_PROJECT_ID } from '../../src/lib/tasks/storage-project';
import { TaskapiMutationError } from './taskapi-mutation-error';
import { TaskapiWriteService } from './taskapi-write-service';

type MockDocument = {
  id: string;
  path: string;
};

function createFirestoreHarness() {
  const sets: Array<{ path: string; data: Record<string, unknown> }> = [];
  const updates: Array<{ path: string; data: Record<string, unknown> }> = [];
  const reads = new Map<string, unknown>();
  const firestore = {
    doc(path: string): MockDocument {
      return {
        id: path.split('/').at(-1) ?? 'doc',
        path,
      };
    },
    collection(path: string) {
      return { path };
    },
    async runTransaction<T>(
      runner: (transaction: {
        get: (reference: { path: string }) => Promise<unknown>;
        set: (reference: MockDocument, data: Record<string, unknown>) => void;
        update: (
          reference: MockDocument,
          data: Record<string, unknown>,
        ) => void;
      }) => Promise<T>,
    ) {
      return runner({
        get: async (reference) => {
          const value = reads.get(reference.path);

          if (Array.isArray(value)) {
            return {
              docs: value.map((item) => ({
                ref: firestore.doc(String((item as { path: string }).path)),
                data: () => item as Record<string, unknown>,
              })),
            };
          }

          const exists = value !== undefined;

          return {
            exists,
            data: () =>
              exists ? (value as Record<string, unknown>) : undefined,
          };
        },
        set: (reference, data) => {
          sets.push({ path: reference.path, data });
        },
        update: (reference, data) => {
          updates.push({ path: reference.path, data });
        },
      });
    },
  };

  return {
    firestore,
    reads,
    sets,
    updates,
  };
}

describe('TaskapiWriteService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('writes update and status-change history when task status changes', async () => {
    const harness = createFirestoreHarness();
    harness.reads.set('users/user-1/projects/proj-1', {
      id: 'proj-1',
      ownerUid: 'user-1',
      name: 'Project one',
      description: null,
      archived: false,
      deletedAt: null,
      createdAt: 't1',
      updatedAt: 't2',
    });
    harness.reads.set('users/user-1/projects/proj-1/tasks/task-1', {
      id: 'task-1',
      ownerUid: 'user-1',
      projectId: 'proj-1',
      title: 'Write docs',
      notes: null,
      tags: ['docs'],
      status: 'todo',
      dueDate: null,
      completedAt: null,
      deletedAt: null,
      createdAt: 't1',
      updatedAt: 't2',
    });

    const service = new TaskapiWriteService(harness.firestore as never);
    await service.updateTask('user-1', {
      projectId: 'proj-1',
      taskId: 'task-1',
      title: 'Write docs',
      notes: '',
      tags: ['docs', 'review'],
      status: 'done',
      dueDate: '',
    });

    expect(harness.updates).toHaveLength(1);
    expect(harness.sets).toHaveLength(2);
    expect(harness.sets.map((entry) => entry.data.action)).toEqual(
      expect.arrayContaining(['update', 'status_change']),
    );
  });

  it('blocks task restore when the parent project is deleted', async () => {
    const harness = createFirestoreHarness();
    harness.reads.set('users/user-1/projects/proj-1', {
      id: 'proj-1',
      ownerUid: 'user-1',
      name: 'Project one',
      description: null,
      archived: false,
      deletedAt: '2026-03-08T00:00:00.000Z',
      createdAt: 't1',
      updatedAt: 't2',
    });
    harness.reads.set('users/user-1/projects/proj-1/tasks/task-1', {
      id: 'task-1',
      ownerUid: 'user-1',
      projectId: 'proj-1',
      title: 'Write docs',
      notes: null,
      tags: [],
      status: 'todo',
      dueDate: null,
      completedAt: null,
      deletedAt: '2026-03-08T00:00:00.000Z',
      createdAt: 't1',
      updatedAt: 't2',
    });

    const service = new TaskapiWriteService(harness.firestore as never);

    const restorePromise = service.restoreTask('user-1', {
      projectId: 'proj-1',
      taskId: 'task-1',
    });

    await expect(restorePromise).rejects.toThrow(TaskapiMutationError);
    await expect(restorePromise).rejects.toThrow(
      'Restore the parent project before changing its tasks.',
    );
  });

  it('restores a deleted storage project before creating a task', async () => {
    const harness = createFirestoreHarness();
    harness.reads.set(`users/user-1/projects/${STORAGE_PROJECT_ID}`, {
      id: STORAGE_PROJECT_ID,
      ownerUid: 'user-1',
      name: '__storage__',
      description: null,
      archived: true,
      deletedAt: '2026-03-08T00:00:00.000Z',
      createdAt: 't1',
      updatedAt: 't2',
    });

    const service = new TaskapiWriteService(harness.firestore as never);
    await service.createTask('user-1', {
      projectId: STORAGE_PROJECT_ID,
      title: 'Inbox item',
      notes: '',
      tags: ['inbox'],
      status: 'todo',
      dueDate: '',
    });

    expect(harness.updates).toHaveLength(1);
    expect(harness.updates[0]?.path).toBe(
      `users/user-1/projects/${STORAGE_PROJECT_ID}`,
    );
    expect(harness.sets).toHaveLength(2);
  });
});
