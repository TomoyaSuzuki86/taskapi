import { beforeEach, describe, expect, it, vi } from 'vitest';

const writeApiMocks = vi.hoisted(() => ({
  createProject: vi.fn(async () => ({ projectId: 'project-from-function' })),
  updateProject: vi.fn(async () => ({ acknowledged: true })),
  deleteProject: vi.fn(async () => ({ acknowledged: true })),
  restoreProject: vi.fn(async () => ({ acknowledged: true })),
}));

vi.mock('@/services/taskapi-write-api', () => ({
  createTaskapiWriteApi: () => writeApiMocks,
}));

import { createFirestoreProjectRepository } from '@/services/firestore-project-repository';

describe('createFirestoreProjectRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates projects through the callable write API', async () => {
    const repository = createFirestoreProjectRepository();
    const projectId = await repository.createProject('user-1', {
      name: 'Server writes',
      description: 'History-safe mutations',
    });

    expect(projectId).toBe('project-from-function');
    expect(writeApiMocks.createProject).toHaveBeenCalledWith({
      name: 'Server writes',
      description: 'History-safe mutations',
    });
  });

  it('updates projects through the callable write API', async () => {
    const repository = createFirestoreProjectRepository();
    await repository.updateProject('user-1', 'proj-1', {
      name: 'Server writes',
      description: 'Updated',
      archived: true,
    });

    expect(writeApiMocks.updateProject).toHaveBeenCalledWith({
      projectId: 'proj-1',
      name: 'Server writes',
      description: 'Updated',
      archived: true,
    });
  });
});
