import {
  Timestamp,
  type DocumentData,
  serverTimestamp,
} from 'firebase/firestore';
import type {
  HistoryAction,
  HistoryEntry,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  Task,
  TaskCreateInput,
  TaskStatus,
  TaskUpdateInput,
} from '@/types/domain';

type FirestoreTimestampLike = Timestamp | Date | string | null | undefined;

type FirestoreProjectRecord = DocumentData & {
  id: string;
  ownerUid: string;
  name: string;
  description: string | null;
  archived?: boolean;
  deletedAt?: FirestoreTimestampLike;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
};

type FirestoreTaskRecord = DocumentData & {
  id: string;
  ownerUid: string;
  projectId: string;
  title: string;
  notes: string | null;
  tags?: string[];
  status: TaskStatus;
  dueDate?: FirestoreTimestampLike;
  completedAt?: FirestoreTimestampLike;
  deletedAt?: FirestoreTimestampLike;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
};

type FirestoreHistoryRecord = DocumentData & {
  id: string;
  entityType: 'project' | 'task';
  entityId: string;
  projectId: string | null;
  action: HistoryAction;
  title: string;
  createdAt?: FirestoreTimestampLike;
};

export function mapProjectRecord(record: FirestoreProjectRecord): Project {
  return {
    id: record.id,
    ownerUid: record.ownerUid,
    name: record.name,
    description: record.description ?? null,
    archived: record.archived ?? false,
    deletedAt: toOptionalIsoTimestamp(record.deletedAt),
    createdAt: toIsoTimestamp(record.createdAt),
    updatedAt: toIsoTimestamp(record.updatedAt),
  };
}

export function mapTaskRecord(record: FirestoreTaskRecord): Task {
  return {
    id: record.id,
    ownerUid: record.ownerUid,
    projectId: record.projectId,
    title: record.title,
    notes: record.notes ?? null,
    tags: normalizeTags(record.tags),
    status: record.status,
    dueDate: toOptionalIsoTimestamp(record.dueDate),
    completedAt: toOptionalIsoTimestamp(record.completedAt),
    deletedAt: toOptionalIsoTimestamp(record.deletedAt),
    createdAt: toIsoTimestamp(record.createdAt),
    updatedAt: toIsoTimestamp(record.updatedAt),
  };
}

export function mapHistoryRecord(record: FirestoreHistoryRecord): HistoryEntry {
  return {
    id: record.id,
    entityType: record.entityType,
    entityId: record.entityId,
    projectId: record.projectId,
    action: record.action,
    title: record.title,
    createdAt: toIsoTimestamp(record.createdAt),
  };
}

export function buildProjectCreateRecord(
  ownerUid: string,
  projectId: string,
  input: ProjectCreateInput,
) {
  const now = serverTimestamp();

  return {
    id: projectId,
    ownerUid,
    name: input.name.trim(),
    description: emptyToNull(input.description),
    archived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildProjectUpdateRecord(input: ProjectUpdateInput) {
  return {
    name: input.name.trim(),
    description: emptyToNull(input.description),
    archived: input.archived,
    updatedAt: serverTimestamp(),
  };
}

export function buildProjectDeleteRecord() {
  return {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function buildProjectRestoreRecord() {
  return {
    deletedAt: null,
    updatedAt: serverTimestamp(),
  };
}

export function buildTaskCreateRecord(
  ownerUid: string,
  projectId: string,
  taskId: string,
  input: TaskCreateInput,
) {
  const now = serverTimestamp();

  return {
    id: taskId,
    ownerUid,
    projectId,
    title: input.title.trim(),
    notes: emptyToNull(input.notes),
    tags: normalizeTags(input.tags),
    status: input.status,
    dueDate: toTimestampOrNull(input.dueDate),
    completedAt: input.status === 'done' ? now : null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildTaskUpdateRecord(input: TaskUpdateInput) {
  return {
    title: input.title.trim(),
    notes: emptyToNull(input.notes),
    tags: normalizeTags(input.tags),
    status: input.status,
    dueDate: toTimestampOrNull(input.dueDate),
    completedAt: input.status === 'done' ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  };
}

export function buildTaskDeleteRecord() {
  return {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function buildTaskRestoreRecord() {
  return {
    deletedAt: null,
    updatedAt: serverTimestamp(),
  };
}

export function buildHistoryRecord(
  historyEntryId: string,
  action: HistoryAction,
  title: string,
  entityType: 'project' | 'task',
  entityId: string,
  projectId: string | null,
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

function toTimestampOrNull(value: string) {
  if (!value) {
    return null;
  }

  return Timestamp.fromDate(new Date(`${value}T00:00:00.000Z`));
}

function toIsoTimestamp(value: FirestoreTimestampLike) {
  if (!value) {
    return new Date(0).toISOString();
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toOptionalIsoTimestamp(value: FirestoreTimestampLike) {
  if (!value) {
    return null;
  }

  return toIsoTimestamp(value);
}
