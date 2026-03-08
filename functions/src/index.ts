import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { TaskapiMutationUseCases } from './application/taskapi-mutation-use-cases';
import { TaskapiQueryService } from './application/taskapi-query-service';
import {
  validateChangeTaskStatusInput,
  validateCreateProjectInput,
  validateCreateTaskInput,
  validateProjectMutationInput,
  validateTaskMutationInput,
  validateUpdateProjectInput,
  validateUpdateTaskInput,
} from './domain/taskapi-validation';
import {
  runAuthenticatedHandler,
  runAuthenticatedQuery,
} from './transport/callable-handlers';

initializeApp();
setGlobalOptions({
  region: process.env.TASKAPI_FUNCTIONS_REGION || 'us-central1',
});

const firestore = getFirestore();
const mutationUseCases = new TaskapiMutationUseCases(firestore);
const queryService = new TaskapiQueryService(firestore);

export const createProject = onCall((request) =>
  runAuthenticatedHandler(request, validateCreateProjectInput, (uid, input) =>
    mutationUseCases.createProject(uid, input),
  ),
);

export const updateProject = onCall((request) =>
  runAuthenticatedHandler(request, validateUpdateProjectInput, (uid, input) =>
    mutationUseCases.updateProject(uid, input),
  ),
);

export const deleteProject = onCall((request) =>
  runAuthenticatedHandler(request, validateProjectMutationInput, (uid, input) =>
    mutationUseCases.deleteProject(uid, input),
  ),
);

export const restoreProject = onCall((request) =>
  runAuthenticatedHandler(request, validateProjectMutationInput, (uid, input) =>
    mutationUseCases.restoreProject(uid, input),
  ),
);

export const createTask = onCall((request) =>
  runAuthenticatedHandler(request, validateCreateTaskInput, (uid, input) =>
    mutationUseCases.createTask(uid, input),
  ),
);

export const updateTask = onCall((request) =>
  runAuthenticatedHandler(request, validateUpdateTaskInput, (uid, input) =>
    mutationUseCases.updateTask(uid, input),
  ),
);

export const deleteTask = onCall((request) =>
  runAuthenticatedHandler(request, validateTaskMutationInput, (uid, input) =>
    mutationUseCases.deleteTask(uid, input),
  ),
);

export const restoreTask = onCall((request) =>
  runAuthenticatedHandler(request, validateTaskMutationInput, (uid, input) =>
    mutationUseCases.restoreTask(uid, input),
  ),
);

export const changeTaskStatus = onCall((request) =>
  runAuthenticatedHandler(
    request,
    validateChangeTaskStatusInput,
    (uid, input) => mutationUseCases.changeTaskStatus(uid, input),
  ),
);

export const listProjects = onCall((request) =>
  runAuthenticatedQuery(request, (uid) => queryService.listProjects(uid)),
);

export const getProject = onCall((request) =>
  runAuthenticatedHandler(request, validateProjectMutationInput, (uid, input) =>
    queryService.getProject(uid, input.projectId),
  ),
);

export const listTasks = onCall((request) =>
  runAuthenticatedHandler(request, validateProjectMutationInput, (uid, input) =>
    queryService.listTasks(uid, input.projectId),
  ),
);

export const listDeletedProjects = onCall((request) =>
  runAuthenticatedQuery(request, (uid) =>
    queryService.listDeletedProjects(uid),
  ),
);

export const listDeletedTasks = onCall((request) =>
  runAuthenticatedHandler(request, validateProjectMutationInput, (uid, input) =>
    queryService.listDeletedTasks(uid, input.projectId),
  ),
);

export const listHistory = onCall((request) =>
  runAuthenticatedQuery(request, (uid) => queryService.listHistory(uid)),
);
