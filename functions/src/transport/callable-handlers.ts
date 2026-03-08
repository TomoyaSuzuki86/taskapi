import type { CallableRequest } from 'firebase-functions/v2/https';
import {
  toFailureResult,
  type MutationResult,
} from '../domain/taskapi-contracts';
import { requireAuthenticatedUid } from '../domain/taskapi-validation';

export async function runAuthenticatedHandler<TInput, TOutput>(
  request: CallableRequest<unknown>,
  validate: (data: unknown) => TInput,
  run: (uid: string, input: TInput) => Promise<MutationResult<TOutput>>,
): Promise<MutationResult<TOutput>> {
  try {
    const uid = requireAuthenticatedUid(request.auth?.uid);
    const input = validate(request.data);
    return await run(uid, input);
  } catch (error) {
    return toFailure<TOutput>(error);
  }
}

export async function runAuthenticatedQuery<TOutput>(
  request: CallableRequest<unknown>,
  run: (uid: string) => Promise<MutationResult<TOutput>>,
): Promise<MutationResult<TOutput>> {
  try {
    const uid = requireAuthenticatedUid(request.auth?.uid);
    return await run(uid);
  } catch (error) {
    return toFailure<TOutput>(error);
  }
}

function toFailure<T>(error: unknown): MutationResult<T> {
  return toFailureResult<T>(error);
}
