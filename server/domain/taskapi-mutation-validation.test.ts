import { describe, expect, it } from 'vitest';
import {
  validateCreateTaskInput,
  validateUpdateProjectInput,
} from './taskapi-mutation-validation';
import { TaskapiMutationError } from './taskapi-mutation-error';

describe('taskapi mutation validation', () => {
  it('accepts valid project update payloads', () => {
    expect(
      validateUpdateProjectInput({
        projectId: 'proj-1',
        name: 'Refine write path',
        description: 'Use callable functions',
        archived: false,
      }),
    ).toEqual({
      projectId: 'proj-1',
      name: 'Refine write path',
      description: 'Use callable functions',
      archived: false,
    });
  });

  it('rejects malformed task payloads', () => {
    expect(() =>
      validateCreateTaskInput({
        projectId: 'proj-1',
        title: '',
        notes: '',
        status: 'doing',
        dueDate: '03/20/2026',
      }),
    ).toThrow(TaskapiMutationError);
  });
});
