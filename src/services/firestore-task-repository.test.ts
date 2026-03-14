import { beforeEach, describe, expect, it, vi } from 'vitest';

const writeApiMocks = vi.hoisted(() => ({
  createTask: vi.fn(async () => ({ taskId: 'task-from-function' })),
  updateTask: vi.fn(async () => ({ acknowledged: true })),
  deleteTask: vi.fn(async () => ({ acknowledged: true })),
  restoreTask: vi.fn(async () => ({ acknowledged: true })),
}));

vi.mock('@/services/taskapi-write-api', () => ({
  createTaskapiWriteApi: () => writeApiMocks,
}));

import { createFirestoreTaskRepository } from '@/services/firestore-task-repository';

describe('createFirestoreTaskRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates tasks through the callable write API', async () => {
    const repository = createFirestoreTaskRepository();
    const taskId = await repository.createTask('user-1', 'proj-1', {
      title: 'Ship write layer',
      notes: 'Move mutations server-side',
      tags: ['backend', 'urgent'],
      status: 'doing',
      dueDate: '2026-03-20',
    });

    expect(taskId).toBe('task-from-function');
    expect(writeApiMocks.createTask).toHaveBeenCalledWith({
      projectId: 'proj-1',
      title: 'Ship write layer',
      notes: 'Move mutations server-side',
      tags: ['backend', 'urgent'],
      status: 'doing',
      dueDate: '2026-03-20',
    });
  });

  it('restores tasks through the callable write API', async () => {
    const repository = createFirestoreTaskRepository();
    await repository.restoreTask('user-1', 'proj-1', 'task-1');

    expect(writeApiMocks.restoreTask).toHaveBeenCalledWith({
      projectId: 'proj-1',
      taskId: 'task-1',
    });
  });
});
