import type {
  MutationErrorCode,
  MutationResult,
} from '../../src/types/mutations';

export class TaskapiMutationError extends Error {
  readonly code: MutationErrorCode;

  constructor(code: MutationErrorCode, message: string) {
    super(message);
    this.name = 'TaskapiMutationError';
    this.code = code;
  }
}

export function mutationSuccess<T>(data: T): MutationResult<T> {
  return {
    ok: true,
    data,
  };
}

export function mutationFailure<T>(
  code: MutationErrorCode,
  message: string,
): MutationResult<T> {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}
