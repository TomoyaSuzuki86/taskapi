// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  mapHistoryRecord,
  mapProjectRecord,
  mapTaskRecord,
} from './firestore-records';

describe('functions firestore record mappers', () => {
  it('maps valid project records', () => {
    expect(
      mapProjectRecord({
        id: 'proj-1',
        ownerUid: 'user-1',
        name: 'Project one',
        description: null,
        archived: false,
        deletedAt: null,
        createdAt: '2026-03-08T00:00:00.000Z',
        updatedAt: '2026-03-08T00:00:00.000Z',
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'proj-1',
        ownerUid: 'user-1',
        name: 'Project one',
      }),
    );
  });

  it('rejects invalid task status values instead of coercing them', () => {
    expect(() =>
      mapTaskRecord({
        id: 'task-1',
        ownerUid: 'user-1',
        projectId: 'proj-1',
        title: 'Write docs',
        notes: null,
        status: 'blocked',
        dueDate: null,
        completedAt: null,
        deletedAt: null,
        createdAt: '2026-03-08T00:00:00.000Z',
        updatedAt: '2026-03-08T00:00:00.000Z',
      }),
    ).toThrow('Stored Firestore data is invalid at task.status.');
  });

  it('rejects missing history timestamps instead of defaulting to epoch', () => {
    expect(() =>
      mapHistoryRecord({
        id: 'hist-1',
        entityType: 'task',
        entityId: 'task-1',
        projectId: 'proj-1',
        action: 'update',
        title: 'Broken history',
      }),
    ).toThrow('Stored Firestore data is invalid at history.createdAt.');
  });
});
