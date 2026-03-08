import { randomUUID } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type QueryDocumentSnapshot,
  type Transaction,
} from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
setGlobalOptions({
  region: process.env.TASKAPI_FUNCTIONS_REGION || 'us-central1',
});

type TaskStatus = 'todo' | 'doing' | 'done';
type MutationErrorCode =
  | 'unauthenticated'
  | 'invalid-argument'
  | 'not-found'
  | 'failed-precondition'
  | 'internal';

type MutationResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: MutationErrorCode;
        message: string;
      };
    };

type MutationAcknowledgement = {
  acknowledged: true;
};

type ProjectCreateInput = {
  name: string;
  description: string;
};

type ProjectUpdateInput = ProjectCreateInput & {
  projectId: string;
  archived: boolean;
};

type ProjectMutationInput = {
  projectId: string;
};

type TaskCreateInput = {
  projectId: string;
  title: string;
  notes: string;
  status: TaskStatus;
  dueDate: string;
};

type TaskUpdateInput = TaskCreateInput & {
  taskId: string;
};

type TaskMutationInput = {
  projectId: string;
  taskId: string;
};

type ProjectRecord = {
  id: string;
  ownerUid: string;
  name: string;
  description: string | null;
  archived: boolean;
  deletedAt: unknown | null;
};

type TaskRecord = {
  id: string;
  ownerUid: string;
  projectId: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  dueDate: unknown | null;
  completedAt: unknown | null;
  deletedAt: unknown | null;
};

class MutationError extends Error {
  readonly code: MutationErrorCode;

  constructor(code: MutationErrorCode, message: string) {
    super(message);
    this.name = 'MutationError';
    this.code = code;
  }
}

const firestore = getFirestore();

export const createProject = onCall(
  async (request): Promise<MutationResult<{ projectId: string }>> => {
    const uid = requireUid(request.auth?.uid);

    try {
      const input = validateCreateProjectInput(request.data);
      const projectId = randomUUID();
      const historyId = randomUUID();

      await firestore.runTransaction(async (transaction) => {
        transaction.set(firestore.doc(projectPath(uid, projectId)), {
          id: projectId,
          ownerUid: uid,
          name: input.name.trim(),
          description: emptyToNull(input.description),
          archived: false,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          firestore.doc(historyPath(uid, historyId)),
          buildHistoryRecord(
            historyId,
            'project',
            projectId,
            projectId,
            'create',
            input.name.trim(),
          ),
        );
      });

      return success({ projectId });
    } catch (error) {
      return failure(error);
    }
  },
);

export const updateProject = onCall(
  async (request): Promise<MutationResult<MutationAcknowledgement>> => {
    const uid = requireUid(request.auth?.uid);

    try {
      const input = validateUpdateProjectInput(request.data);

      await firestore.runTransaction(async (transaction) => {
        const projectRef = firestore.doc(projectPath(uid, input.projectId));
        const project = readProjectSnapshot(
          await transaction.get(projectRef),
          input.projectId,
        );
        const historyId = randomUUID();

        transaction.update(projectRef, {
          name: input.name.trim(),
          description: emptyToNull(input.description),
          archived: input.archived,
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          firestore.doc(historyPath(uid, historyId)),
          buildHistoryRecord(
            historyId,
            'project',
            project.id,
            project.id,
            'update',
            input.name.trim(),
          ),
        );
      });

      return success({ acknowledged: true });
    } catch (error) {
      return failure(error);
    }
  },
);

export const deleteProject = onCall(
  async (request): Promise<MutationResult<MutationAcknowledgement>> => {
    const uid = requireUid(request.auth?.uid);

    try {
      const input = validateProjectMutationInput(request.data);

      await firestore.runTransaction(async (transaction) => {
        const projectRef = firestore.doc(projectPath(uid, input.projectId));
        const project = readProjectSnapshot(
          await transaction.get(projectRef),
          input.projectId,
        );
        const taskDocuments = await transaction.get(
          firestore.collection(tasksPath(uid, input.projectId)),
        );

        taskDocuments.docs.forEach((taskDocument) => {
          const task = readTaskRecord(taskDocument, taskDocument.id);

          if (task.deletedAt) {
            return;
          }

          transaction.update(taskDocument.ref, {
            deletedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const taskHistoryId = randomUUID();
          transaction.set(
            firestore.doc(historyPath(uid, taskHistoryId)),
            buildHistoryRecord(
              taskHistoryId,
              'task',
              task.id,
              input.projectId,
              'delete',
              task.title,
            ),
          );
        });

        transaction.update(projectRef, {
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const projectHistoryId = randomUUID();
        transaction.set(
          firestore.doc(historyPath(uid, projectHistoryId)),
          buildHistoryRecord(
            projectHistoryId,
            'project',
            project.id,
            project.id,
            'delete',
            project.name,
          ),
        );
      });

      return success({ acknowledged: true });
    } catch (error) {
      return failure(error);
    }
  },
);

export const restoreProject = onCall(
  async (request): Promise<MutationResult<MutationAcknowledgement>> => {
    const uid = requireUid(request.auth?.uid);

    try {
      const input = validateProjectMutationInput(request.data);

      await firestore.runTransaction(async (transaction) => {
        const projectRef = firestore.doc(projectPath(uid, input.projectId));
        const project = readProjectSnapshot(
          await transaction.get(projectRef),
          input.projectId,
        );
        const historyId = randomUUID();

        transaction.update(projectRef, {
          deletedAt: null,
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          firestore.doc(historyPath(uid, historyId)),
          buildHistoryRecord(
            historyId,
            'project',
            project.id,
            project.id,
            'restore',
            project.name,
          ),
        );
      });

      return success({ acknowledged: true });
    } catch (error) {
      return failure(error);
    }
  },
);

export const createTask = onCall(
  async (request): Promise<MutationResult<{ taskId: string }>> => {
    const uid = requireUid(request.auth?.uid);

    try {
      const input = validateCreateTaskInput(request.data);
      const taskId = randomUUID();
      const historyId = randomUUID();

      await firestore.runTransaction(async (transaction) => {
        await assertProjectIsActive(transaction, uid, input.projectId);

        transaction.set(firestore.doc(taskPath(uid, input.projectId, taskId)), {
          id: taskId,
          ownerUid: uid,
          projectId: input.projectId,
          title: input.title.trim(),
          notes: emptyToNull(input.notes),
          status: input.status,
          dueDate: dateInputToTimestamp(input.dueDate),
          completedAt: input.status === 'done' ? serverTimestamp() : null,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          firestore.doc(historyPath(uid, historyId)),
          buildHistoryRecord(
            historyId,
            'task',
            taskId,
            input.projectId,
            'create',
            input.title.trim(),
          ),
        );
      });

      return success({ taskId });
    } catch (error) {
      return failure(error);
    }
  },
);

export const updateTask = onCall(
  async (request): Promise<MutationResult<MutationAcknowledgement>> => {
    const uid = requireUid(request.auth?.uid);

    try {
      const input = validateUpdateTaskInput(request.data);

      await firestore.runTransaction(async (transaction) => {
        await assertProjectIsActive(transaction, uid, input.projectId);

        const taskRef = firestore.doc(
          taskPath(uid, input.projectId, input.taskId),
        );
        const task = readTaskSnapshot(
          await transaction.get(taskRef),
          input.taskId,
        );
        const historyId = randomUUID();

        transaction.update(taskRef, {
          title: input.title.trim(),
          notes: emptyToNull(input.notes),
          status: input.status,
          dueDate: dateInputToTimestamp(input.dueDate),
          completedAt: nextCompletedAt(task, input.status),
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          firestore.doc(historyPath(uid, historyId)),
          buildHistoryRecord(
            historyId,
            'task',
            task.id,
            input.projectId,
            'update',
            input.title.trim(),
          ),
        );

        if (task.status !== input.status) {
          const statusHistoryId = randomUUID();
          transaction.set(
            firestore.doc(historyPath(uid, statusHistoryId)),
            buildHistoryRecord(
              statusHistoryId,
              'task',
              task.id,
              input.projectId,
              'status_change',
              `${input.title.trim()} -> ${input.status}`,
            ),
          );
        }
      });

      return success({ acknowledged: true });
    } catch (error) {
      return failure(error);
    }
  },
);

export const deleteTask = onCall(
  async (request): Promise<MutationResult<MutationAcknowledgement>> => {
    const uid = requireUid(request.auth?.uid);

    try {
      const input = validateTaskMutationInput(request.data);

      await firestore.runTransaction(async (transaction) => {
        const taskRef = firestore.doc(
          taskPath(uid, input.projectId, input.taskId),
        );
        const task = readTaskSnapshot(
          await transaction.get(taskRef),
          input.taskId,
        );
        const historyId = randomUUID();

        transaction.update(taskRef, {
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          firestore.doc(historyPath(uid, historyId)),
          buildHistoryRecord(
            historyId,
            'task',
            task.id,
            input.projectId,
            'delete',
            task.title,
          ),
        );
      });

      return success({ acknowledged: true });
    } catch (error) {
      return failure(error);
    }
  },
);

export const restoreTask = onCall(
  async (request): Promise<MutationResult<MutationAcknowledgement>> => {
    const uid = requireUid(request.auth?.uid);

    try {
      const input = validateTaskMutationInput(request.data);

      await firestore.runTransaction(async (transaction) => {
        await assertProjectIsActive(transaction, uid, input.projectId);

        const taskRef = firestore.doc(
          taskPath(uid, input.projectId, input.taskId),
        );
        const task = readTaskSnapshot(
          await transaction.get(taskRef),
          input.taskId,
        );
        const historyId = randomUUID();

        transaction.update(taskRef, {
          deletedAt: null,
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          firestore.doc(historyPath(uid, historyId)),
          buildHistoryRecord(
            historyId,
            'task',
            task.id,
            input.projectId,
            'restore',
            task.title,
          ),
        );
      });

      return success({ acknowledged: true });
    } catch (error) {
      return failure(error);
    }
  },
);

function requireUid(uid: string | undefined) {
  if (!uid) {
    throw new MutationError(
      'unauthenticated',
      'You must sign in before making changes.',
    );
  }

  return uid;
}

function validateCreateProjectInput(data: unknown): ProjectCreateInput {
  const record = asRecord(data);

  return {
    name: requiredText(record, 'name'),
    description: optionalText(record, 'description'),
  };
}

function validateUpdateProjectInput(data: unknown): ProjectUpdateInput {
  const record = asRecord(data);

  return {
    projectId: documentId(record, 'projectId'),
    name: requiredText(record, 'name'),
    description: optionalText(record, 'description'),
    archived: requiredBoolean(record, 'archived'),
  };
}

function validateProjectMutationInput(data: unknown): ProjectMutationInput {
  const record = asRecord(data);
  return { projectId: documentId(record, 'projectId') };
}

function validateCreateTaskInput(data: unknown): TaskCreateInput {
  const record = asRecord(data);

  return {
    projectId: documentId(record, 'projectId'),
    title: requiredText(record, 'title'),
    notes: optionalText(record, 'notes'),
    status: taskStatus(record, 'status'),
    dueDate: dateInput(record, 'dueDate'),
  };
}

function validateUpdateTaskInput(data: unknown): TaskUpdateInput {
  const record = asRecord(data);

  return {
    projectId: documentId(record, 'projectId'),
    taskId: documentId(record, 'taskId'),
    title: requiredText(record, 'title'),
    notes: optionalText(record, 'notes'),
    status: taskStatus(record, 'status'),
    dueDate: dateInput(record, 'dueDate'),
  };
}

function validateTaskMutationInput(data: unknown): TaskMutationInput {
  const record = asRecord(data);

  return {
    projectId: documentId(record, 'projectId'),
    taskId: documentId(record, 'taskId'),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new MutationError(
      'invalid-argument',
      'Request payload must be a JSON object.',
    );
  }

  return value as Record<string, unknown>;
}

function requiredText(record: Record<string, unknown>, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new MutationError(
      'invalid-argument',
      `${fieldName} must be a non-empty string.`,
    );
  }

  return value.trim();
}

function optionalText(record: Record<string, unknown>, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string') {
    throw new MutationError(
      'invalid-argument',
      `${fieldName} must be a string.`,
    );
  }

  return value;
}

function requiredBoolean(record: Record<string, unknown>, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'boolean') {
    throw new MutationError(
      'invalid-argument',
      `${fieldName} must be a boolean.`,
    );
  }

  return value;
}

function taskStatus(
  record: Record<string, unknown>,
  fieldName: string,
): TaskStatus {
  const value = record[fieldName];

  if (value !== 'todo' && value !== 'doing' && value !== 'done') {
    throw new MutationError(
      'invalid-argument',
      `${fieldName} must be one of todo, doing, or done.`,
    );
  }

  return value;
}

function dateInput(record: Record<string, unknown>, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string') {
    throw new MutationError(
      'invalid-argument',
      `${fieldName} must be a string.`,
    );
  }

  if (value.length === 0) {
    return '';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new MutationError(
      'invalid-argument',
      `${fieldName} must use YYYY-MM-DD format.`,
    );
  }

  return value;
}

function documentId(record: Record<string, unknown>, fieldName: string) {
  const value = record[fieldName];

  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.includes('/')
  ) {
    throw new MutationError(
      'invalid-argument',
      `${fieldName} must be a valid document id.`,
    );
  }

  return value.trim();
}

async function assertProjectIsActive(
  transaction: Transaction,
  uid: string,
  projectId: string,
) {
  const project = readProjectSnapshot(
    await transaction.get(firestore.doc(projectPath(uid, projectId))),
    projectId,
  );

  if (project.deletedAt) {
    throw new MutationError(
      'failed-precondition',
      'Restore the parent project before changing its tasks.',
    );
  }

  return project;
}

function readProjectSnapshot(
  snapshot: FirebaseFirestore.DocumentSnapshot,
  fallbackId: string,
): ProjectRecord {
  if (!snapshot.exists) {
    throw new MutationError('not-found', 'Project not found.');
  }

  const data = snapshot.data();

  if (
    !data ||
    typeof data.name !== 'string' ||
    typeof data.ownerUid !== 'string'
  ) {
    throw new MutationError('internal', 'Stored project data is invalid.');
  }

  return {
    id: typeof data.id === 'string' ? data.id : fallbackId,
    ownerUid: data.ownerUid,
    name: data.name,
    description: typeof data.description === 'string' ? data.description : null,
    archived: data.archived === true,
    deletedAt: data.deletedAt ?? null,
  };
}

function readTaskSnapshot(
  snapshot: FirebaseFirestore.DocumentSnapshot,
  fallbackId: string,
): TaskRecord {
  if (!snapshot.exists) {
    throw new MutationError('not-found', 'Task not found.');
  }

  return readTaskData(snapshot.data(), fallbackId);
}

function readTaskRecord(
  snapshot: QueryDocumentSnapshot,
  fallbackId: string,
): TaskRecord {
  return readTaskData(snapshot.data(), fallbackId);
}

function readTaskData(
  data: FirebaseFirestore.DocumentData | undefined,
  fallbackId: string,
): TaskRecord {
  if (
    !data ||
    typeof data.title !== 'string' ||
    typeof data.ownerUid !== 'string' ||
    typeof data.projectId !== 'string' ||
    !isTaskStatus(data.status)
  ) {
    throw new MutationError('internal', 'Stored task data is invalid.');
  }

  return {
    id: typeof data.id === 'string' ? data.id : fallbackId,
    ownerUid: data.ownerUid,
    projectId: data.projectId,
    title: data.title,
    notes: typeof data.notes === 'string' ? data.notes : null,
    status: data.status,
    dueDate: data.dueDate ?? null,
    completedAt: data.completedAt ?? null,
    deletedAt: data.deletedAt ?? null,
  };
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'todo' || value === 'doing' || value === 'done';
}

function buildHistoryRecord(
  historyId: string,
  entityType: 'project' | 'task',
  entityId: string,
  projectId: string | null,
  action: 'create' | 'update' | 'delete' | 'restore' | 'status_change',
  title: string,
) {
  return {
    id: historyId,
    entityType,
    entityId,
    projectId,
    action,
    title,
    createdAt: serverTimestamp(),
  };
}

function nextCompletedAt(task: TaskRecord, nextStatus: TaskStatus) {
  if (nextStatus === 'done') {
    if (task.status === 'done' && task.completedAt) {
      return task.completedAt;
    }

    return serverTimestamp();
  }

  return null;
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function dateInputToTimestamp(value: string) {
  if (!value) {
    return null;
  }

  return Timestamp.fromDate(new Date(`${value}T00:00:00.000Z`));
}

function projectPath(uid: string, projectId: string) {
  return `users/${uid}/projects/${projectId}`;
}

function tasksPath(uid: string, projectId: string) {
  return `users/${uid}/projects/${projectId}/tasks`;
}

function taskPath(uid: string, projectId: string, taskId: string) {
  return `users/${uid}/projects/${projectId}/tasks/${taskId}`;
}

function historyPath(uid: string, historyId: string) {
  return `users/${uid}/history/${historyId}`;
}

function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

function success<T>(data: T): MutationResult<T> {
  return {
    ok: true,
    data,
  };
}

function failure<T>(error: unknown): MutationResult<T> {
  if (error instanceof MutationError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: 'internal',
      message: 'The write service failed unexpectedly.',
    },
  };
}
