import { onCall } from 'firebase-functions/v2/https';
import type {
  CreateProjectMutationResult,
  CreateProjectMutationData,
  CreateTaskMutationResult,
  CreateTaskMutationData,
  DeleteProjectMutationResult,
  DeleteTaskMutationResult,
  MutationAcknowledgement,
  RestoreProjectMutationResult,
  RestoreTaskMutationResult,
  UpdateProjectMutationResult,
  UpdateTaskMutationResult,
} from '../../src/types/mutations';
import { getAdminFirestore } from './firebase-admin';
import {
  mutationFailure,
  mutationSuccess,
  TaskapiMutationError,
} from '../domain/taskapi-mutation-error';
import {
  validateCreateProjectInput,
  validateCreateTaskInput,
  validateProjectMutationInput,
  validateTaskMutationInput,
  validateUpdateProjectInput,
  validateUpdateTaskInput,
} from '../domain/taskapi-mutation-validation';
import { TaskapiWriteService } from '../domain/taskapi-write-service';

const defaultRegion = process.env.TASKAPI_FUNCTIONS_REGION || 'us-central1';

function createWriteService() {
  return new TaskapiWriteService(getAdminFirestore());
}

export const createProject = onCall(
  { region: defaultRegion },
  async (request): Promise<CreateProjectMutationResult> => {
    const uid = request.auth?.uid;

    if (!uid) {
      return mutationFailure<CreateProjectMutationData>(
        'UNAUTHENTICATED',
        'You must sign in before creating a project.',
      );
    }

    try {
      const input = validateCreateProjectInput(request.data);
      return mutationSuccess(
        await createWriteService().createProject(uid, input),
      );
    } catch (error) {
      return toMutationFailure<CreateProjectMutationData>(error);
    }
  },
);

export const updateProject = onCall(
  { region: defaultRegion },
  async (request): Promise<UpdateProjectMutationResult> => {
    const uid = request.auth?.uid;

    if (!uid) {
      return mutationFailure<MutationAcknowledgement>(
        'UNAUTHENTICATED',
        'You must sign in before updating a project.',
      );
    }

    try {
      const input = validateUpdateProjectInput(request.data);
      return mutationSuccess(
        await createWriteService().updateProject(uid, input),
      );
    } catch (error) {
      return toMutationFailure<MutationAcknowledgement>(error);
    }
  },
);

export const deleteProject = onCall(
  { region: defaultRegion },
  async (request): Promise<DeleteProjectMutationResult> => {
    const uid = request.auth?.uid;

    if (!uid) {
      return mutationFailure<MutationAcknowledgement>(
        'UNAUTHENTICATED',
        'You must sign in before deleting a project.',
      );
    }

    try {
      const input = validateProjectMutationInput(request.data);
      return mutationSuccess(
        await createWriteService().deleteProject(uid, input),
      );
    } catch (error) {
      return toMutationFailure<MutationAcknowledgement>(error);
    }
  },
);

export const restoreProject = onCall(
  { region: defaultRegion },
  async (request): Promise<RestoreProjectMutationResult> => {
    const uid = request.auth?.uid;

    if (!uid) {
      return mutationFailure<MutationAcknowledgement>(
        'UNAUTHENTICATED',
        'You must sign in before restoring a project.',
      );
    }

    try {
      const input = validateProjectMutationInput(request.data);
      return mutationSuccess(
        await createWriteService().restoreProject(uid, input),
      );
    } catch (error) {
      return toMutationFailure<MutationAcknowledgement>(error);
    }
  },
);

export const createTask = onCall(
  { region: defaultRegion },
  async (request): Promise<CreateTaskMutationResult> => {
    const uid = request.auth?.uid;

    if (!uid) {
      return mutationFailure<CreateTaskMutationData>(
        'UNAUTHENTICATED',
        'You must sign in before creating a task.',
      );
    }

    try {
      const input = validateCreateTaskInput(request.data);
      return mutationSuccess(await createWriteService().createTask(uid, input));
    } catch (error) {
      return toMutationFailure<CreateTaskMutationData>(error);
    }
  },
);

export const updateTask = onCall(
  { region: defaultRegion },
  async (request): Promise<UpdateTaskMutationResult> => {
    const uid = request.auth?.uid;

    if (!uid) {
      return mutationFailure<MutationAcknowledgement>(
        'UNAUTHENTICATED',
        'You must sign in before updating a task.',
      );
    }

    try {
      const input = validateUpdateTaskInput(request.data);
      return mutationSuccess(await createWriteService().updateTask(uid, input));
    } catch (error) {
      return toMutationFailure<MutationAcknowledgement>(error);
    }
  },
);

export const deleteTask = onCall(
  { region: defaultRegion },
  async (request): Promise<DeleteTaskMutationResult> => {
    const uid = request.auth?.uid;

    if (!uid) {
      return mutationFailure<MutationAcknowledgement>(
        'UNAUTHENTICATED',
        'You must sign in before deleting a task.',
      );
    }

    try {
      const input = validateTaskMutationInput(request.data);
      return mutationSuccess(await createWriteService().deleteTask(uid, input));
    } catch (error) {
      return toMutationFailure<MutationAcknowledgement>(error);
    }
  },
);

export const restoreTask = onCall(
  { region: defaultRegion },
  async (request): Promise<RestoreTaskMutationResult> => {
    const uid = request.auth?.uid;

    if (!uid) {
      return mutationFailure<MutationAcknowledgement>(
        'UNAUTHENTICATED',
        'You must sign in before restoring a task.',
      );
    }

    try {
      const input = validateTaskMutationInput(request.data);
      return mutationSuccess(
        await createWriteService().restoreTask(uid, input),
      );
    } catch (error) {
      return toMutationFailure<MutationAcknowledgement>(error);
    }
  },
);

function toMutationFailure<T>(error: unknown) {
  if (error instanceof TaskapiMutationError) {
    return mutationFailure<T>(error.code, error.message);
  }

  return mutationFailure<T>(
    'INTERNAL',
    'The write service failed unexpectedly.',
  );
}
