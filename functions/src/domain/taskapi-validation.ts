import type {
  ChangeTaskStatusMutationPayload,
  CreateTaskMutationPayload,
  ProjectCreateInput,
  ProjectMutationPayload,
  TaskMutationPayload,
  UpdateProjectMutationPayload,
  UpdateTaskMutationPayload,
} from './taskapi-contracts';
import { TaskapiContractError } from './taskapi-contracts';
import type { TaskStatus } from './taskapi-contracts';

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

export function validateChangeTaskStatusInput(
  data: unknown,
): ChangeTaskStatusMutationPayload {
  const record = asRecord(data);

  return {
    projectId: readDocumentId(record, 'projectId'),
    taskId: readDocumentId(record, 'taskId'),
    status: readTaskStatus(record, 'status'),
  };
}

export function requireAuthenticatedUid(uid: string | undefined) {
  if (!uid) {
    throw new TaskapiContractError(
      'UNAUTHENTICATED',
      'You must sign in before making changes.',
    );
  }

  return uid;
}

function asRecord(value: unknown): RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TaskapiContractError(
      'INVALID_ARGUMENT',
      'Request payload must be a JSON object.',
    );
  }

  return value as RecordValue;
}

function readRequiredText(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TaskapiContractError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a non-empty string.`,
    );
  }

  return value.trim();
}

function readOptionalText(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string') {
    throw new TaskapiContractError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a string.`,
    );
  }

  return value;
}

function readBoolean(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'boolean') {
    throw new TaskapiContractError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a boolean.`,
    );
  }

  return value;
}

function readTaskStatus(record: RecordValue, fieldName: string): TaskStatus {
  const value = record[fieldName];

  if (value !== 'todo' && value !== 'doing' && value !== 'done') {
    throw new TaskapiContractError(
      'INVALID_ARGUMENT',
      `${fieldName} must be one of todo, doing, or done.`,
    );
  }

  return value;
}

function readDateInput(record: RecordValue, fieldName: string) {
  const value = record[fieldName];

  if (typeof value !== 'string') {
    throw new TaskapiContractError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a string.`,
    );
  }

  if (value.length === 0) {
    return '';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TaskapiContractError(
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
    throw new TaskapiContractError(
      'INVALID_ARGUMENT',
      `${fieldName} must be a valid document id.`,
    );
  }

  return value.trim();
}
