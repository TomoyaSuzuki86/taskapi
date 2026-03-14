import { randomUUID } from 'node:crypto';
import {
  FieldValue,
  Timestamp,
  type Firestore,
} from 'firebase-admin/firestore';
import type {
  ChangeTaskStatusMutationPayload,
  ChangeTaskStatusMutationResult,
  CreateProjectMutationData,
  CreateProjectMutationResult,
  CreateTaskMutationData,
  CreateTaskMutationPayload,
  CreateTaskMutationResult,
  DeleteProjectMutationResult,
  DeleteTaskMutationResult,
  MutationAcknowledgement,
  ProjectCreateInput,
  ProjectMutationPayload,
  RestoreProjectMutationResult,
  RestoreTaskMutationResult,
  TaskMutationPayload,
  TaskapiProject,
  TaskapiTask,
  UpdateProjectMutationPayload,
  UpdateProjectMutationResult,
  UpdateTaskMutationPayload,
  UpdateTaskMutationResult,
} from '../domain/taskapi-contracts';
import {
  TaskapiContractError,
  success,
  toFailureResult,
  type MutationResult,
} from '../domain/taskapi-contracts';
import {
  historyDocumentPath,
  projectDocumentPath,
  taskDocumentPath,
  tasksCollectionPath,
} from '../persistence/firestore-paths';
import {
  mapProjectRecord,
  mapTaskRecord,
} from '../persistence/firestore-records';
import {
  buildStorageProjectRecord,
  buildStorageProjectRestorePatch,
  STORAGE_PROJECT_ID,
} from '../../../src/lib/tasks/storage-project';

export class TaskapiMutationUseCases {
  constructor(private readonly firestore: Firestore) {}

  async createProject(
    uid: string,
    input: ProjectCreateInput,
  ): Promise<CreateProjectMutationResult> {
    return this.execute(async () => {
      const projectId = randomUUID();
      const historyId = randomUUID();

      await this.firestore.runTransaction(async (transaction) => {
        transaction.set(
          this.firestore.doc(projectDocumentPath(uid, projectId)),
          {
            id: projectId,
            ownerUid: uid,
            name: input.name.trim(),
            description: emptyToNull(input.description),
            archived: false,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, historyId)),
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

      return success<CreateProjectMutationData>({ projectId });
    });
  }

  async updateProject(
    uid: string,
    input: UpdateProjectMutationPayload,
  ): Promise<UpdateProjectMutationResult> {
    return this.execute(async () => {
      await this.firestore.runTransaction(async (transaction) => {
        const projectRef = this.firestore.doc(
          projectDocumentPath(uid, input.projectId),
        );
        const project = readProject(
          (await transaction.get(projectRef)).data(),
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
          this.firestore.doc(historyDocumentPath(uid, historyId)),
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

      return acknowledged();
    });
  }

  async deleteProject(
    uid: string,
    input: ProjectMutationPayload,
  ): Promise<DeleteProjectMutationResult> {
    return this.execute(async () => {
      await this.firestore.runTransaction(async (transaction) => {
        const projectRef = this.firestore.doc(
          projectDocumentPath(uid, input.projectId),
        );
        const projectSnapshot = await transaction.get(projectRef);
        if (!projectSnapshot.exists) {
          throw new TaskapiContractError('NOT_FOUND', 'Project not found.');
        }

        const project = readProject(projectSnapshot.data(), input.projectId);
        const tasksSnapshot = await transaction.get(
          this.firestore.collection(tasksCollectionPath(uid, input.projectId)),
        );

        for (const taskDocument of tasksSnapshot.docs) {
          const task = readTask(taskDocument.data(), taskDocument.id);
          if (task.deletedAt !== null) {
            continue;
          }

          transaction.update(taskDocument.ref, {
            deletedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const taskHistoryId = randomUUID();
          transaction.set(
            this.firestore.doc(historyDocumentPath(uid, taskHistoryId)),
            buildHistoryRecord(
              taskHistoryId,
              'task',
              task.id,
              input.projectId,
              'delete',
              task.title,
            ),
          );
        }

        transaction.update(projectRef, {
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const projectHistoryId = randomUUID();
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, projectHistoryId)),
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

      return acknowledged();
    });
  }

  async restoreProject(
    uid: string,
    input: ProjectMutationPayload,
  ): Promise<RestoreProjectMutationResult> {
    return this.execute(async () => {
      await this.firestore.runTransaction(async (transaction) => {
        const projectRef = this.firestore.doc(
          projectDocumentPath(uid, input.projectId),
        );
        const projectSnapshot = await transaction.get(projectRef);
        if (!projectSnapshot.exists) {
          throw new TaskapiContractError('NOT_FOUND', 'Project not found.');
        }

        const project = readProject(projectSnapshot.data(), input.projectId);
        const historyId = randomUUID();

        transaction.update(projectRef, {
          deletedAt: null,
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, historyId)),
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

      return acknowledged();
    });
  }

  async createTask(
    uid: string,
    input: CreateTaskMutationPayload,
  ): Promise<CreateTaskMutationResult> {
    return this.execute(async () => {
      const taskId = randomUUID();
      const historyId = randomUUID();

      await this.firestore.runTransaction(async (transaction) => {
        const projectId = await ensureTaskProject(
          transaction,
          this.firestore,
          uid,
          input.projectId,
        );

        transaction.set(
          this.firestore.doc(taskDocumentPath(uid, projectId, taskId)),
          {
            id: taskId,
            ownerUid: uid,
            projectId,
            title: input.title.trim(),
            notes: emptyToNull(input.notes),
            tags: normalizeTags(input.tags),
            status: input.status,
            dueDate: dateInputToTimestamp(input.dueDate),
            completedAt: input.status === 'done' ? serverTimestamp() : null,
            deletedAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, historyId)),
          buildHistoryRecord(
            historyId,
            'task',
            taskId,
            projectId,
            'create',
            input.title.trim(),
          ),
        );
      });

      return success<CreateTaskMutationData>({ taskId });
    });
  }

  async updateTask(
    uid: string,
    input: UpdateTaskMutationPayload,
  ): Promise<UpdateTaskMutationResult> {
    return this.execute(async () => {
      await this.firestore.runTransaction(async (transaction) => {
        await assertProjectIsActive(
          transaction,
          this.firestore,
          uid,
          input.projectId,
        );

        const taskRef = this.firestore.doc(
          taskDocumentPath(uid, input.projectId, input.taskId),
        );
        const taskSnapshot = await transaction.get(taskRef);
        if (!taskSnapshot.exists) {
          throw new TaskapiContractError('NOT_FOUND', 'Task not found.');
        }

        const task = readTask(taskSnapshot.data(), input.taskId);
        transaction.update(taskRef, {
          title: input.title.trim(),
          notes: emptyToNull(input.notes),
          tags: normalizeTags(input.tags),
          status: input.status,
          dueDate: dateInputToTimestamp(input.dueDate),
          completedAt: nextCompletedAt(task, input.status),
          updatedAt: serverTimestamp(),
        });

        const historyId = randomUUID();
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, historyId)),
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
            this.firestore.doc(historyDocumentPath(uid, statusHistoryId)),
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

      return acknowledged();
    });
  }

  async deleteTask(
    uid: string,
    input: TaskMutationPayload,
  ): Promise<DeleteTaskMutationResult> {
    return this.execute(async () => {
      await this.firestore.runTransaction(async (transaction) => {
        const taskRef = this.firestore.doc(
          taskDocumentPath(uid, input.projectId, input.taskId),
        );
        const taskSnapshot = await transaction.get(taskRef);
        if (!taskSnapshot.exists) {
          throw new TaskapiContractError('NOT_FOUND', 'Task not found.');
        }

        const task = readTask(taskSnapshot.data(), input.taskId);
        const historyId = randomUUID();

        transaction.update(taskRef, {
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, historyId)),
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

      return acknowledged();
    });
  }

  async restoreTask(
    uid: string,
    input: TaskMutationPayload,
  ): Promise<RestoreTaskMutationResult> {
    return this.execute(async () => {
      await this.firestore.runTransaction(async (transaction) => {
        await assertProjectIsActive(
          transaction,
          this.firestore,
          uid,
          input.projectId,
        );

        const taskRef = this.firestore.doc(
          taskDocumentPath(uid, input.projectId, input.taskId),
        );
        const taskSnapshot = await transaction.get(taskRef);
        if (!taskSnapshot.exists) {
          throw new TaskapiContractError('NOT_FOUND', 'Task not found.');
        }

        const task = readTask(taskSnapshot.data(), input.taskId);
        const historyId = randomUUID();

        transaction.update(taskRef, {
          deletedAt: null,
          updatedAt: serverTimestamp(),
        });
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, historyId)),
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

      return acknowledged();
    });
  }

  async changeTaskStatus(
    uid: string,
    input: ChangeTaskStatusMutationPayload,
  ): Promise<ChangeTaskStatusMutationResult> {
    return this.execute(async () => {
      await this.firestore.runTransaction(async (transaction) => {
        await assertProjectIsActive(
          transaction,
          this.firestore,
          uid,
          input.projectId,
        );

        const taskRef = this.firestore.doc(
          taskDocumentPath(uid, input.projectId, input.taskId),
        );
        const taskSnapshot = await transaction.get(taskRef);
        if (!taskSnapshot.exists) {
          throw new TaskapiContractError('NOT_FOUND', 'Task not found.');
        }

        const task = readTask(taskSnapshot.data(), input.taskId);
        transaction.update(taskRef, {
          status: input.status,
          completedAt: nextCompletedAt(task, input.status),
          updatedAt: serverTimestamp(),
        });

        const updateHistoryId = randomUUID();
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, updateHistoryId)),
          buildHistoryRecord(
            updateHistoryId,
            'task',
            task.id,
            input.projectId,
            'update',
            task.title,
          ),
        );

        const statusHistoryId = randomUUID();
        transaction.set(
          this.firestore.doc(historyDocumentPath(uid, statusHistoryId)),
          buildHistoryRecord(
            statusHistoryId,
            'task',
            task.id,
            input.projectId,
            'status_change',
            `${task.title} -> ${input.status}`,
          ),
        );
      });

      return acknowledged();
    });
  }

  private async execute<T>(
    run: () => Promise<MutationResult<T>>,
  ): Promise<MutationResult<T>> {
    try {
      return await run();
    } catch (error) {
      return toFailureResult<T>(error, 'The mutation failed unexpectedly.');
    }
  }
}

async function assertProjectIsActive(
  transaction: FirebaseFirestore.Transaction,
  firestore: Firestore,
  uid: string,
  projectId: string,
): Promise<TaskapiProject> {
  const projectRef = firestore.doc(projectDocumentPath(uid, projectId));
  const projectSnapshot = await transaction.get(projectRef);
  if (!projectSnapshot.exists) {
    throw new TaskapiContractError('NOT_FOUND', 'Project not found.');
  }

  const project = readProject(projectSnapshot.data(), projectId);
  if (project.deletedAt !== null) {
    throw new TaskapiContractError(
      'FAILED_PRECONDITION',
      'Restore the parent project before changing its tasks.',
    );
  }

  return project;
}

async function ensureTaskProject(
  transaction: FirebaseFirestore.Transaction,
  firestore: Firestore,
  uid: string,
  projectId: string,
) {
  if (projectId !== STORAGE_PROJECT_ID) {
    await assertProjectIsActive(transaction, firestore, uid, projectId);
    return projectId;
  }

  const projectRef = firestore.doc(projectDocumentPath(uid, STORAGE_PROJECT_ID));
  const projectSnapshot = await transaction.get(projectRef);

  if (!projectSnapshot.exists) {
    const timestamp = serverTimestamp();
    transaction.set(projectRef, buildStorageProjectRecord(uid, timestamp));

    return STORAGE_PROJECT_ID;
  }

  const project = readProject(projectSnapshot.data(), STORAGE_PROJECT_ID);
  if (project.deletedAt !== null) {
    transaction.update(projectRef, buildStorageProjectRestorePatch(serverTimestamp()));
  }

  return STORAGE_PROJECT_ID;
}

function readProject(
  record: FirebaseFirestore.DocumentData | undefined,
  fallbackId: string,
): TaskapiProject {
  if (!record) {
    throw new TaskapiContractError('NOT_FOUND', 'Project not found.');
  }

  try {
    return mapProjectRecord({
      ...record,
      id: typeof record.id === 'string' ? record.id : fallbackId,
    });
  } catch {
    throw new TaskapiContractError(
      'INTERNAL',
      'Stored project data is invalid.',
    );
  }
}

function readTask(
  record: FirebaseFirestore.DocumentData | undefined,
  fallbackId: string,
): TaskapiTask {
  if (!record) {
    throw new TaskapiContractError('NOT_FOUND', 'Task not found.');
  }

  try {
    return mapTaskRecord({
      ...record,
      id: typeof record.id === 'string' ? record.id : fallbackId,
    });
  } catch {
    throw new TaskapiContractError('INTERNAL', 'Stored task data is invalid.');
  }
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

function acknowledged() {
  return success<MutationAcknowledgement>({ acknowledged: true });
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTags(tags: string[]) {
  const uniqueTags = new Set<string>();

  for (const tag of tags) {
    const normalized = tag.trim();
    if (!normalized) {
      continue;
    }

    uniqueTags.add(normalized);
  }

  return [...uniqueTags];
}

function dateInputToTimestamp(value: string) {
  if (!value) {
    return null;
  }

  return Timestamp.fromDate(new Date(`${value}T00:00:00.000Z`));
}

function nextCompletedAt(task: TaskapiTask, nextStatus: TaskapiTask['status']) {
  if (nextStatus === 'done') {
    if (task.status === 'done' && task.completedAt) {
      return Timestamp.fromDate(new Date(task.completedAt));
    }

    return serverTimestamp();
  }

  return null;
}

function serverTimestamp() {
  return FieldValue.serverTimestamp();
}
