// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  requireAuthenticatedUid,
  validateChangeTaskStatusInput,
  validateCreateTaskInput,
  validateUpdateTaskInput,
} from './taskapi-validation';
import { TaskapiContractError } from './taskapi-contracts';

describe('taskapi validation', () => {
  it('accepts valid change-task-status payloads', () => {
    expect(
      validateChangeTaskStatusInput({
        projectId: 'proj-1',
        taskId: 'task-1',
        status: 'done',
      }),
    ).toEqual({
      projectId: 'proj-1',
      taskId: 'task-1',
      status: 'done',
    });
  });

  it('rejects malformed task payloads with INVALID_ARGUMENT', () => {
    expect(() =>
      validateCreateTaskInput({
        projectId: 'proj-1',
        title: '',
        notes: '',
        status: 'doing',
        dueDate: '03/20/2026',
      }),
    ).toThrowError(
      expect.objectContaining({
        code: 'INVALID_ARGUMENT',
      }),
    );
  });

  it('rejects missing authenticated users with UNAUTHENTICATED', () => {
    try {
      requireAuthenticatedUid(undefined);
      throw new Error('Expected requireAuthenticatedUid to throw.');
    } catch (error) {
      expect(error).toBeInstanceOf(TaskapiContractError);
      expect((error as TaskapiContractError).code).toBe('UNAUTHENTICATED');
    }
  });

  it('defaults omitted tags to an empty list for task mutations', () => {
    expect(
      validateCreateTaskInput({
        projectId: 'proj-1',
        title: 'Inbox task',
        notes: '',
        status: 'todo',
        dueDate: '',
      }),
    ).toEqual({
      projectId: 'proj-1',
      title: 'Inbox task',
      notes: '',
      tags: [],
      status: 'todo',
      dueDate: '',
    });
  });

  it('defaults omitted tags to an empty list for task updates', () => {
    expect(
      validateUpdateTaskInput({
        projectId: 'proj-1',
        taskId: 'task-1',
        title: 'Inbox task',
        notes: '',
        status: 'todo',
        dueDate: '',
      }),
    ).toEqual({
      projectId: 'proj-1',
      taskId: 'task-1',
      title: 'Inbox task',
      notes: '',
      tags: [],
      status: 'todo',
      dueDate: '',
    });
  });
});
