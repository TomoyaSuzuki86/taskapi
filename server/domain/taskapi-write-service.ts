import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  CreateProjectMutationData,
  CreateTaskMutationData,
  CreateTaskMutationPayload,
  MutationAcknowledgement,
  ProjectMutationPayload,
  TaskMutationPayload,
  UpdateProjectMutationPayload,
  UpdateTaskMutationPayload,
} from '../../src/types/mutations';
import type { ProjectCreateInput } from '../../src/types/domain';
import {
  historyDocumentPath,
  projectDocumentPath,
  taskDocumentPath,
  tasksCollectionPath,
} from '../persistence/firestore-paths';
import { TaskapiMutationError } from './taskapi-mutation-error';

type DocumentReferenceLike = {
  path: string;
  id: string;
};

type CollectionReferenceLike = {
  path: string;
};

type DocumentSnapshotLike = {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
};

type QuerySnapshotLike = {
  docs: Array<{
    ref: DocumentReferenceLike;
    data(): Record<string, unknown> | undefined;
  }>;
};

type TransactionLike = {
  get(
    reference: DocumentReferenceLike | CollectionReferenceLike,
  ): Promise<DocumentSnapshotLike | QuerySnapshotLike>;
  set(reference: DocumentReferenceLike, data: Record<string, unknown>): void;
  update(reference: DocumentReferenceLike, data: Record<string, unknown>): void;
};

type FirestoreLike = {
  doc(path: string): DocumentReferenceLike;
  collection(path: string): CollectionReferenceLike;
  runTransaction<T>(
    runner: (transaction: TransactionLike) => Promise<T>,
  ): Promise<T>;
};

type ProjectRecord = {
  id: string;
  ownerUid: string;
  name: string;
  description: string | null;
  archived: boolean;
  deletedAt: unknown | null;
  createdAt: unknown;
  updatedAt: unknown;
};

type TaskRecord = {
  id: string;
  ownerUid: string;
  projectId: string;
  title: string;
  notes: string | null;
  status: 'todo' | 'doing' | 'done';
  dueDate: unknown | null;
  completedAt: unknown | null;
  deletedAt: unknown | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export class TaskapiWriteService {
  constructor(private readonly firestore: FirestoreLike) {}

  async createProject(
    uid: string,
    input: ProjectCreateInput,
  ): Promise<CreateProjectMutationData> {
    const projectId = randomUUID();
    const historyEntryId = randomUUID();

    await this.firestore.runTransaction(async (transaction) => {
      const projectRef = this.firestore.doc(
        projectDocumentPath(uid, projectId),
      );

      transaction.set(
        projectRef,
        buildProjectCreateRecord(uid, projectId, input),
      );
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
          'project',
          projectId,
          projectId,
          'create',
          input.name.trim(),
        ),
      );
    });

    return { projectId };
  }

  async updateProject(
    uid: string,
    input: UpdateProjectMutationPayload,
  ): Promise<MutationAcknowledgement> {
    await this.firestore.runTransaction(async (transaction) => {
      const projectRef = this.firestore.doc(
        projectDocumentPath(uid, input.projectId),
      );
      const projectSnapshot = (await transaction.get(
        projectRef,
      )) as DocumentSnapshotLike;
      const project = readProjectSnapshot(projectSnapshot, input.projectId);

      transaction.update(projectRef, {
        name: input.name.trim(),
        description: emptyToNull(input.description),
        archived: input.archived,
        updatedAt: serverTimestamp(),
      });
      const historyEntryId = randomUUID();
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
          'project',
          project.id,
          project.id,
          'update',
          input.name.trim(),
        ),
      );
    });

    return { acknowledged: true };
  }

  async deleteProject(
    uid: string,
    input: ProjectMutationPayload,
  ): Promise<MutationAcknowledgement> {
    await this.firestore.runTransaction(async (transaction) => {
      const projectRef = this.firestore.doc(
        projectDocumentPath(uid, input.projectId),
      );
      const projectSnapshot = (await transaction.get(
        projectRef,
      )) as DocumentSnapshotLike;
      const project = readProjectSnapshot(projectSnapshot, input.projectId);
      const tasksSnapshot = (await transaction.get(
        this.firestore.collection(tasksCollectionPath(uid, input.projectId)),
      )) as QuerySnapshotLike;

      for (const taskDocument of tasksSnapshot.docs) {
        const task = readTaskRecord(taskDocument.data(), taskDocument.ref.id);

        if (task.deletedAt) {
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

    return { acknowledged: true };
  }

  async restoreProject(
    uid: string,
    input: ProjectMutationPayload,
  ): Promise<MutationAcknowledgement> {
    await this.firestore.runTransaction(async (transaction) => {
      const projectRef = this.firestore.doc(
        projectDocumentPath(uid, input.projectId),
      );
      const projectSnapshot = (await transaction.get(
        projectRef,
      )) as DocumentSnapshotLike;
      const project = readProjectSnapshot(projectSnapshot, input.projectId);

      transaction.update(projectRef, {
        deletedAt: null,
        updatedAt: serverTimestamp(),
      });
      const historyEntryId = randomUUID();
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
          'project',
          project.id,
          project.id,
          'restore',
          project.name,
        ),
      );
    });

    return { acknowledged: true };
  }

  async createTask(
    uid: string,
    input: CreateTaskMutationPayload,
  ): Promise<CreateTaskMutationData> {
    const taskId = randomUUID();
    const historyEntryId = randomUUID();

    await this.firestore.runTransaction(async (transaction) => {
      const projectRef = this.firestore.doc(
        projectDocumentPath(uid, input.projectId),
      );
      const projectSnapshot = (await transaction.get(
        projectRef,
      )) as DocumentSnapshotLike;
      assertProjectIsActive(projectSnapshot, input.projectId);

      transaction.set(
        this.firestore.doc(taskDocumentPath(uid, input.projectId, taskId)),
        buildTaskCreateRecord(uid, taskId, input),
      );
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
          'task',
          taskId,
          input.projectId,
          'create',
          input.title.trim(),
        ),
      );
    });

    return { taskId };
  }

  async updateTask(
    uid: string,
    input: UpdateTaskMutationPayload,
  ): Promise<MutationAcknowledgement> {
    await this.firestore.runTransaction(async (transaction) => {
      const projectRef = this.firestore.doc(
        projectDocumentPath(uid, input.projectId),
      );
      const taskRef = this.firestore.doc(
        taskDocumentPath(uid, input.projectId, input.taskId),
      );
      const [projectSnapshot, taskSnapshot] = (await Promise.all([
        transaction.get(projectRef),
        transaction.get(taskRef),
      ])) as [DocumentSnapshotLike, DocumentSnapshotLike];
      assertProjectIsActive(projectSnapshot, input.projectId);
      const task = readTaskSnapshot(taskSnapshot, input.taskId);

      transaction.update(taskRef, buildTaskUpdatePatch(task, input));
      const historyEntryId = randomUUID();
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
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

    return { acknowledged: true };
  }

  async deleteTask(
    uid: string,
    input: TaskMutationPayload,
  ): Promise<MutationAcknowledgement> {
    await this.firestore.runTransaction(async (transaction) => {
      const taskRef = this.firestore.doc(
        taskDocumentPath(uid, input.projectId, input.taskId),
      );
      const taskSnapshot = (await transaction.get(
        taskRef,
      )) as DocumentSnapshotLike;
      const task = readTaskSnapshot(taskSnapshot, input.taskId);

      transaction.update(taskRef, {
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const historyEntryId = randomUUID();
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
          'task',
          task.id,
          input.projectId,
          'delete',
          task.title,
        ),
      );
    });

    return { acknowledged: true };
  }

  async restoreTask(
    uid: string,
    input: TaskMutationPayload,
  ): Promise<MutationAcknowledgement> {
    await this.firestore.runTransaction(async (transaction) => {
      const projectRef = this.firestore.doc(
        projectDocumentPath(uid, input.projectId),
      );
      const taskRef = this.firestore.doc(
        taskDocumentPath(uid, input.projectId, input.taskId),
      );
      const [projectSnapshot, taskSnapshot] = (await Promise.all([
        transaction.get(projectRef),
        transaction.get(taskRef),
      ])) as [DocumentSnapshotLike, DocumentSnapshotLike];
      assertProjectIsActive(projectSnapshot, input.projectId);
      const task = readTaskSnapshot(taskSnapshot, input.taskId);

      transaction.update(taskRef, {
        deletedAt: null,
        updatedAt: serverTimestamp(),
      });
      const historyEntryId = randomUUID();
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
          'task',
          task.id,
          input.projectId,
          'restore',
          task.title,
        ),
      );
    });

    return { acknowledged: true };
  }
}

function buildProjectCreateRecord(
  uid: string,
  projectId: string,
  input: ProjectCreateInput,
) {
  return {
    id: projectId,
    ownerUid: uid,
    name: input.name.trim(),
    description: emptyToNull(input.description),
    archived: false,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildTaskCreateRecord(
  uid: string,
  taskId: string,
  input: CreateTaskMutationPayload,
) {
  return {
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
  };
}

function buildTaskUpdatePatch(
  existingTask: TaskRecord,
  input: UpdateTaskMutationPayload,
) {
  return {
    title: input.title.trim(),
    notes: emptyToNull(input.notes),
    status: input.status,
    dueDate: dateInputToTimestamp(input.dueDate),
    completedAt: nextCompletedAt(existingTask, input.status),
    updatedAt: serverTimestamp(),
  };
}

function buildHistoryRecord(
  historyEntryId: string,
  entityType: 'project' | 'task',
  entityId: string,
  projectId: string | null,
  action: 'create' | 'update' | 'delete' | 'restore' | 'status_change',
  title: string,
) {
  return {
    id: historyEntryId,
    entityType,
    entityId,
    projectId,
    action,
    title,
    createdAt: serverTimestamp(),
  };
}

function assertProjectIsActive(
  projectSnapshot: DocumentSnapshotLike,
  projectId: string,
) {
  const project = readProjectSnapshot(projectSnapshot, projectId);

  if (project.deletedAt) {
    throw new TaskapiMutationError(
      'FAILED_PRECONDITION',
      'Restore the parent project before changing its tasks.',
    );
  }

  return project;
}

function readProjectSnapshot(
  snapshot: DocumentSnapshotLike,
  projectId: string,
): ProjectRecord {
  if (!snapshot.exists) {
    throw new TaskapiMutationError('NOT_FOUND', 'Project not found.');
  }

  return readProjectRecord(snapshot.data(), projectId);
}

function readTaskSnapshot(
  snapshot: DocumentSnapshotLike,
  taskId: string,
): TaskRecord {
  if (!snapshot.exists) {
    throw new TaskapiMutationError('NOT_FOUND', 'Task not found.');
  }

  return readTaskRecord(snapshot.data(), taskId);
}

function readProjectRecord(
  data: Record<string, unknown> | undefined,
  fallbackId: string,
) {
  if (
    !data ||
    typeof data.name !== 'string' ||
    typeof data.ownerUid !== 'string'
  ) {
    throw new TaskapiMutationError(
      'INTERNAL',
      'Stored project data is invalid.',
    );
  }

  return {
    id: typeof data.id === 'string' ? data.id : fallbackId,
    ownerUid: data.ownerUid,
    name: data.name,
    description: typeof data.description === 'string' ? data.description : null,
    archived: data.archived === true,
    deletedAt: data.deletedAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } satisfies ProjectRecord;
}

function readTaskRecord(
  data: Record<string, unknown> | undefined,
  fallbackId: string,
) {
  if (
    !data ||
    typeof data.title !== 'string' ||
    typeof data.ownerUid !== 'string' ||
    typeof data.projectId !== 'string' ||
    !isTaskStatus(data.status)
  ) {
    throw new TaskapiMutationError('INTERNAL', 'Stored task data is invalid.');
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
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  } satisfies TaskRecord;
}

function isTaskStatus(value: unknown): value is TaskRecord['status'] {
  return value === 'todo' || value === 'doing' || value === 'done';
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

function nextCompletedAt(
  existingTask: TaskRecord,
  nextStatus: TaskRecord['status'],
) {
  if (nextStatus === 'done') {
    if (existingTask.status === 'done' && existingTask.completedAt) {
      return existingTask.completedAt;
    }

    return serverTimestamp();
  }

  return null;
}

function serverTimestamp() {
  return FieldValue.serverTimestamp();
}
