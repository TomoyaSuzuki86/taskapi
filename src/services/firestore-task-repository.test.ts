import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => {
  const getFirebaseFirestore = vi.fn(() => 'firestore-instance');
  const collection = vi.fn((_firestore: unknown, path: string) => ({ path }));
  const doc = vi.fn((arg1: unknown, arg2?: string, arg3?: string) => {
    if (typeof arg1 === 'object' && arg1 !== null && 'path' in arg1 && !arg2) {
      return {
        id: 'generated-id',
        path: `${String((arg1 as { path: string }).path)}/generated-id`,
      };
    }

    const path = [arg1, arg2, arg3].filter(Boolean).join('/');
    return { id: String(arg3 ?? arg2 ?? 'generated-id'), path };
  });
  const getDoc = vi.fn();
  const writeBatch = vi.fn();

  return {
    getFirebaseFirestore,
    collection,
    doc,
    getDoc,
    writeBatch,
  };
});

vi.mock('@/lib/firebase/firestore', () => ({
  getFirebaseFirestore: firestoreMocks.getFirebaseFirestore,
}));

vi.mock('firebase/firestore', async () => {
  const actual =
    await vi.importActual<typeof import('firebase/firestore')>(
      'firebase/firestore',
    );

  return {
    ...actual,
    collection: firestoreMocks.collection,
    doc: firestoreMocks.doc,
    getDoc: firestoreMocks.getDoc,
    writeBatch: firestoreMocks.writeBatch,
    onSnapshot: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
  };
});

import { createFirestoreTaskRepository } from '@/services/firestore-task-repository';

describe('createFirestoreTaskRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes restore history when restoring a task', async () => {
    const batchUpdate = vi.fn();
    const batchSet = vi.fn();
    const batchCommit = vi.fn(async () => undefined);

    firestoreMocks.writeBatch.mockReturnValue({
      update: batchUpdate,
      set: batchSet,
      commit: batchCommit,
    });
    firestoreMocks.getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'proj-1',
          ownerUid: 'user-1',
          name: 'Project one',
          description: null,
          archived: false,
          deletedAt: null,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-02T00:00:00.000Z'),
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'task-1',
          ownerUid: 'user-1',
          projectId: 'proj-1',
          title: 'Write tests',
          notes: null,
          status: 'todo',
          dueDate: null,
          completedAt: null,
          deletedAt: new Date('2026-03-08T00:00:00.000Z'),
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-08T00:00:00.000Z'),
        }),
      });

    const repository = createFirestoreTaskRepository();
    await repository.restoreTask('user-1', 'proj-1', 'task-1');

    expect(batchUpdate).toHaveBeenCalledTimes(1);
    expect(batchSet).toHaveBeenCalledTimes(1);
    expect(batchCommit).toHaveBeenCalledTimes(1);
    const historyRecord = batchSet.mock.calls[0]?.[1];

    expect(historyRecord).toMatchObject({
      entityType: 'task',
      entityId: 'task-1',
      projectId: 'proj-1',
      action: 'restore',
      title: 'Write tests',
    });
  });

  it('rejects task restore when the parent project is still deleted', async () => {
    firestoreMocks.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        id: 'proj-1',
        ownerUid: 'user-1',
        name: 'Project one',
        description: null,
        archived: false,
        deletedAt: new Date('2026-03-08T00:00:00.000Z'),
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-08T00:00:00.000Z'),
      }),
    });

    const repository = createFirestoreTaskRepository();

    await expect(
      repository.restoreTask('user-1', 'proj-1', 'task-1'),
    ).rejects.toThrow('Restore the parent project before restoring its tasks.');
  });
});
