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

const STORAGE_PROJECT_ID = '__taskapi_storage__';
const STORAGE_PROJECT_NAME = '__storage__';

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
  tags: string[];
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

      transaction.update(projectRef, buildProjectUpdateRecord(input));
      const historyEntryId = randomUUID();
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
          'project',
          project.id,
          project.id,
          'update',
          input.name?.trim() ?? project.name, // input.nameがundefinedの場合を考慮
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
      const projectId = await ensureStorageProject(
        transaction,
        this.firestore,
        uid,
        input.projectId,
      );

      transaction.set(
        this.firestore.doc(taskDocumentPath(uid, projectId, taskId)),
        buildTaskCreateRecord(uid, projectId, taskId, input),
      );
      transaction.set(
        this.firestore.doc(historyDocumentPath(uid, historyEntryId)),
        buildHistoryRecord(
          historyEntryId,
          'task',
          taskId,
          projectId,
          'create',
          input.title.trim() as string,
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
          input.title?.trim() ?? task.title, // input.titleがundefinedの場合を考慮
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
            `${input.title?.trim() ?? task.title} -> ${input.status}`, // input.titleがundefinedの場合を考慮
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
    description: emptyToNull(input.description ?? ''),
    archived: false,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildProjectUpdateRecord(input: UpdateProjectMutationPayload) {
  const record: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.name !== undefined) {
    record.name = input.name.trim();
  }
  if (input.description !== undefined) {
    record.description = emptyToNull(input.description);
  }
  if (input.archived !== undefined) {
    record.archived = input.archived;
  }

  return record;
}

function buildTaskCreateRecord(
  uid: string,
  projectId: string,
  taskId: string,
  input: CreateTaskMutationPayload,
) {
  return {
    id: taskId,
    ownerUid: uid,
    projectId,
    title: input.title.trim(),
    notes: emptyToNull(input.notes ?? ''),
    tags: normalizeTags(input.tags),
    status: input.status,
    dueDate: dateInputToTimestamp(input.dueDate ?? ''),
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
  const updatePatch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) {
    updatePatch.title = input.title.trim();
  }
  if (input.notes !== undefined) {
    updatePatch.notes = emptyToNull(input.notes);
  }
  if (input.tags !== undefined) {
    updatePatch.tags = normalizeTags(input.tags);
  }
  if (input.status !== undefined) {
    updatePatch.status = input.status;
    updatePatch.completedAt = nextCompletedAt(existingTask, input.status);
  }
  if (input.dueDate !== undefined) {
    updatePatch.dueDate = dateInputToTimestamp(input.dueDate);
  }

  return updatePatch;
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

async function ensureStorageProject(
  transaction: TransactionLike,
  firestore: FirestoreLike,
  uid: string,
  requestedProjectId: string,
) {
  const projectRef = firestore.doc(projectDocumentPath(uid, requestedProjectId));
  const projectSnapshot = (await transaction.get(projectRef)) as DocumentSnapshotLike;

  if (projectSnapshot.exists) {
    assertProjectIsActive(projectSnapshot, requestedProjectId);
    return requestedProjectId;
  }

  if (requestedProjectId !== STORAGE_PROJECT_ID) {
    throw new TaskapiMutationError('NOT_FOUND', 'Project not found.');
  }

  transaction.set(projectRef, {
    id: STORAGE_PROJECT_ID,
    ownerUid: uid,
    name: STORAGE_PROJECT_NAME,
    description: null,
    archived: false,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    system: true,
  });

  return STORAGE_PROJECT_ID;
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
    tags: normalizeTags(data.tags),
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

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueTags = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const normalized = item.trim();
    if (normalized.length === 0) {
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
