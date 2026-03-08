import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/lib/firebase/functions';
import {
  TASKAPI_WRITE_FUNCTIONS,
  type CreateProjectMutationData,
  type CreateTaskMutationData,
  type MutationAcknowledgement,
  type TaskapiWriteContractMap,
  type TaskapiWriteFunctionName,
} from '@/types/mutations';

type TaskapiWriteFunctionData<Name extends TaskapiWriteFunctionName> =
  TaskapiWriteContractMap[Name]['result'] extends
    | { ok: true; data: infer Data }
    | { ok: false; error: unknown }
    ? Data
    : never;

export type TaskapiWriteApi = {
  createProject: (
    payload: TaskapiWriteContractMap['createProject']['payload'],
  ) => Promise<CreateProjectMutationData>;
  updateProject: (
    payload: TaskapiWriteContractMap['updateProject']['payload'],
  ) => Promise<MutationAcknowledgement>;
  deleteProject: (
    payload: TaskapiWriteContractMap['deleteProject']['payload'],
  ) => Promise<MutationAcknowledgement>;
  restoreProject: (
    payload: TaskapiWriteContractMap['restoreProject']['payload'],
  ) => Promise<MutationAcknowledgement>;
  createTask: (
    payload: TaskapiWriteContractMap['createTask']['payload'],
  ) => Promise<CreateTaskMutationData>;
  updateTask: (
    payload: TaskapiWriteContractMap['updateTask']['payload'],
  ) => Promise<MutationAcknowledgement>;
  deleteTask: (
    payload: TaskapiWriteContractMap['deleteTask']['payload'],
  ) => Promise<MutationAcknowledgement>;
  restoreTask: (
    payload: TaskapiWriteContractMap['restoreTask']['payload'],
  ) => Promise<MutationAcknowledgement>;
};

export function createTaskapiWriteApi(): TaskapiWriteApi {
  return {
    createProject(payload) {
      return callTaskapiWriteFunction('createProject', payload);
    },
    updateProject(payload) {
      return callTaskapiWriteFunction('updateProject', payload);
    },
    deleteProject(payload) {
      return callTaskapiWriteFunction('deleteProject', payload);
    },
    restoreProject(payload) {
      return callTaskapiWriteFunction('restoreProject', payload);
    },
    createTask(payload) {
      return callTaskapiWriteFunction('createTask', payload);
    },
    updateTask(payload) {
      return callTaskapiWriteFunction('updateTask', payload);
    },
    deleteTask(payload) {
      return callTaskapiWriteFunction('deleteTask', payload);
    },
    restoreTask(payload) {
      return callTaskapiWriteFunction('restoreTask', payload);
    },
  };
}

async function callTaskapiWriteFunction<Name extends TaskapiWriteFunctionName>(
  name: Name,
  payload: TaskapiWriteContractMap[Name]['payload'],
): Promise<TaskapiWriteFunctionData<Name>> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error(
      'You are offline. Reconnect before saving changes to taskapi.',
    );
  }

  const callable = httpsCallable<
    TaskapiWriteContractMap[Name]['payload'],
    TaskapiWriteContractMap[Name]['result']
  >(getFirebaseFunctions(), TASKAPI_WRITE_FUNCTIONS[name]);

  try {
    const response = await callable(payload);

    if (!response.data.ok) {
      throw new Error(response.data.error.message);
    }

    return response.data.data as TaskapiWriteFunctionData<Name>;
  } catch (error) {
    throw new Error(getTaskapiWriteErrorMessage(error));
  }
}

function getTaskapiWriteErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Request failed for an unknown reason.';
  }

  if (error instanceof FirebaseError) {
    if (error.code === 'functions/unauthenticated') {
      return 'You must sign in again before making changes.';
    }

    if (error.code === 'functions/deadline-exceeded') {
      return 'The write request timed out. Check the network connection and try again.';
    }

    if (error.code === 'functions/unavailable') {
      return 'The write service is unavailable right now. Try again shortly.';
    }
  }

  return error.message || 'Request failed.';
}
