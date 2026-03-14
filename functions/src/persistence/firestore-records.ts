import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import type {
  TaskapiHistoryEntry,
  TaskapiProject,
  TaskapiTask,
} from '../domain/taskapi-contracts';
import { TaskapiContractError } from '../domain/taskapi-contracts';

type FirestoreTimestampLike = Timestamp | Date | string | null | undefined;

export function mapProjectRecord(record: DocumentData): TaskapiProject {
  return {
    id: readRequiredString(record.id, 'project.id'),
    ownerUid: readRequiredString(record.ownerUid, 'project.ownerUid'),
    name: readRequiredString(record.name, 'project.name'),
    description: readOptionalString(record.description, 'project.description'),
    archived: readBoolean(record.archived, 'project.archived'),
    deletedAt: toOptionalIsoTimestamp(record.deletedAt),
    createdAt: toIsoTimestamp(record.createdAt, 'project.createdAt'),
    updatedAt: toIsoTimestamp(record.updatedAt, 'project.updatedAt'),
  };
}

export function mapTaskRecord(record: DocumentData): TaskapiTask {
  return {
    id: readRequiredString(record.id, 'task.id'),
    ownerUid: readRequiredString(record.ownerUid, 'task.ownerUid'),
    projectId: readRequiredString(record.projectId, 'task.projectId'),
    title: readRequiredString(record.title, 'task.title'),
    notes: readOptionalString(record.notes, 'task.notes'),
    tags: readTags(record.tags),
    status: readTaskStatus(record.status),
    dueDate: toOptionalIsoTimestamp(record.dueDate),
    completedAt: toOptionalIsoTimestamp(record.completedAt),
    deletedAt: toOptionalIsoTimestamp(record.deletedAt),
    createdAt: toIsoTimestamp(record.createdAt, 'task.createdAt'),
    updatedAt: toIsoTimestamp(record.updatedAt, 'task.updatedAt'),
  };
}

export function mapHistoryRecord(record: DocumentData): TaskapiHistoryEntry {
  return {
    id: readRequiredString(record.id, 'history.id'),
    entityType: readHistoryEntityType(record.entityType),
    entityId: readRequiredString(record.entityId, 'history.entityId'),
    projectId: readNullableString(record.projectId, 'history.projectId'),
    action: readHistoryAction(record.action),
    title: readRequiredString(record.title, 'history.title'),
    createdAt: toIsoTimestamp(record.createdAt, 'history.createdAt'),
  };
}

function readRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.length === 0) {
    throw invalidStoredData(fieldName);
  }

  return value;
}

function readOptionalString(value: unknown, fieldName: string) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw invalidStoredData(fieldName);
  }

  return value;
}

function readNullableString(value: unknown, fieldName: string) {
  if (value === null || value === undefined) {
    return null;
  }

  return readRequiredString(value, fieldName);
}

function readBoolean(value: unknown, fieldName: string) {
  if (typeof value !== 'boolean') {
    throw invalidStoredData(fieldName);
  }

  return value;
}

function readTaskStatus(value: unknown): TaskapiTask['status'] {
  if (value === 'todo' || value === 'doing' || value === 'done') {
    return value;
  }

  throw invalidStoredData('task.status');
}

function readTags(value: unknown) {
  if (value === null || value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw invalidStoredData('task.tags');
  }

  const uniqueTags = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') {
      throw invalidStoredData('task.tags');
    }

    const normalized = item.trim();
    if (!normalized) {
      continue;
    }

    uniqueTags.add(normalized);
  }

  return [...uniqueTags];
}

function readHistoryEntityType(
  value: unknown,
): TaskapiHistoryEntry['entityType'] {
  if (value === 'project' || value === 'task') {
    return value;
  }

  throw invalidStoredData('history.entityType');
}

function readHistoryAction(value: unknown): TaskapiHistoryEntry['action'] {
  if (
    value === 'create' ||
    value === 'update' ||
    value === 'delete' ||
    value === 'restore' ||
    value === 'status_change'
  ) {
    return value;
  }

  throw invalidStoredData('history.action');
}

function toIsoTimestamp(value: FirestoreTimestampLike, fieldName: string) {
  if (value === null || value === undefined) {
    throw invalidStoredData(fieldName);
  }

  const date = toDate(value, fieldName);
  return date.toISOString();
}

function toOptionalIsoTimestamp(value: FirestoreTimestampLike) {
  if (value === null || value === undefined) {
    return null;
  }

  return toDate(value, 'timestamp').toISOString();
}

function toDate(value: FirestoreTimestampLike, fieldName: string) {
  let date: Date;

  if (value instanceof Timestamp) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    throw invalidStoredData(fieldName);
  }

  if (Number.isNaN(date.getTime())) {
    throw invalidStoredData(fieldName);
  }

  return date;
}

function invalidStoredData(fieldName: string) {
  throw new TaskapiContractError(
    'INTERNAL',
    `Stored Firestore data is invalid at ${fieldName}.`,
  );
}
