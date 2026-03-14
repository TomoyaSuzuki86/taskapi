import type {
  CreateTaskMutationPayload,
  ProjectMutationPayload,
  TaskMutationPayload,
  UpdateProjectMutationPayload,
  UpdateTaskMutationPayload,
} from '../../src/types/mutations';
import type { ProjectCreateInput, TaskStatus } from '../../src/types/domain';
import { TaskapiMutationError } from './taskapi-mutation-error';

type RecordValue = Record<string, unknown>;

export function validateCreateProjectInput(data: unknown): ProjectCreateInput {
  const record = asRecord(data);

  return {
    name: readRequiredText(record, 'name'),
    description: readOptionalText(record, 'description'),
  };
}

export function validateUpdateProjectInput(
  data: unknown,
): UpdateProjectMutationPayload {
  const record = asRecord(data);

  return {
    projectId: readDocumentId(record, 'projectId'),
    name: readRequiredText(record, 'name'),
    description: readOptionalText(record, 'description'),
    archived: readBoolean(record, 'archived'),
  };
}

export function validateProjectMutationInput(
  data: unknown,
): ProjectMutationPayload {
  const record = asRecord(data);

  return {
    projectId: readDocumentId(record, 'projectId'),
  };
}

export function validateCreateTaskInput(
  data: unknown,
): CreateTaskMutationPayload {
  const record = asRecord(data);

  return {
    projectId: readDocumentId(record, 'projectId'),
    title: readRequiredText(record, 'title'),
    notes: readOptionalText(record, 'notes'),
    tags: readTags(record, 'tags'),
    status: readTaskStatus(record, 'status'),
    dueDate: readDateInput(record, 'dueDate'),
  };
}

export function validateUpdateTaskInput(
  data: unknown,
): UpdateTaskMutationPayload {
  const record = asRecord(data);

  return {
    projectId: readDocumentId(record, 'projectId'),
    taskId: readDocumentId(record, 'taskId'),
    title: readRequiredText(record, 'title'),
    notes: readOptionalText(record, 'notes'),
    tags: readTags(record, 'tags'),
    status: readTaskStatus(record, 'status'),
    dueDate: readDateInput(record, 'dueDate'),
  };
}

export function validateTaskMutationInput(data: unknown): TaskMutationPayload {
  const record = asRecord(data);

  return {
    projectId: readDocumentId(record, 'projectId'),
    taskId: readDocumentId(record, 'taskId'),
  };
}

function asRecord(value: unknown): RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      'Request payload must be a JSON object.',
    );
  }

  return value as RecordValue;
}

function readRequiredText(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a non-empty string.`,
    );
  }

  return value.trim();
}

function readOptionalText(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string') {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a string.`,
    );
  }

  return value;
}

function readBoolean(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'boolean') {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a boolean.`,
    );
  }

  return value;
}

function readTaskStatus(record: RecordValue, fieldName: string): TaskStatus {
  const value = record[fieldName];

  if (value !== 'todo' && value !== 'doing' && value !== 'done') {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      `${fieldName} must be one of todo, doing, or done.`,
    );
  }

  return value;
}

function readDateInput(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string') {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a string.`,
    );
  }

  if (value.length === 0) {
    return '';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      `${fieldName} must use YYYY-MM-DD format.`,
    );
  }

  return value;
}

function readDocumentId(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.includes('/')
  ) {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a valid document id.`,
    );
  }

  return value.trim();
}

function readTags(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (!Array.isArray(value)) {
    throw new TaskapiMutationError(
      'INVALID_ARGUMENT',
      `${fieldName} must be an array of strings.`,
    );
  }

  const uniqueTags = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') {
      throw new TaskapiMutationError(
        'INVALID_ARGUMENT',
        `${fieldName} must contain only strings.`,
      );
    }

    const normalized = item.trim();
    if (normalized.length === 0) {
      continue;
    }

    uniqueTags.add(normalized);
  }

  return [...uniqueTags];
}
