import * as z from 'zod/v4';

const mutationErrorCodeSchema = z.enum([
  'UNAUTHENTICATED',
  'PERMISSION_DENIED',
  'INVALID_ARGUMENT',
  'NOT_FOUND',
  'FAILED_PRECONDITION',
  'INTERNAL',
]);

const mutationErrorSchema = z.object({
  code: mutationErrorCodeSchema,
  message: z.string(),
});

const taskStatusSchema = z.enum(['todo', 'doing', 'done']);

const projectSchema = z.object({
  id: z.string(),
  ownerUid: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  archived: z.boolean(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const taskSchema = z.object({
  id: z.string(),
  ownerUid: z.string(),
  projectId: z.string(),
  title: z.string(),
  notes: z.string().nullable(),
  status: taskStatusSchema,
  dueDate: z.string().nullable(),
  completedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const historyEntrySchema = z.object({
  id: z.string(),
  entityType: z.enum(['project', 'task']),
  entityId: z.string(),
  projectId: z.string().nullable(),
  action: z.enum(['create', 'update', 'delete', 'restore', 'status_change']),
  title: z.string(),
  createdAt: z.string(),
});

export const listProjectsResultSchema = resultSchema(
  z.object({
    projects: z.array(projectSchema),
  }),
);

export const getProjectResultSchema = resultSchema(
  z.object({
    project: projectSchema.nullable(),
  }),
);

export const listTasksResultSchema = resultSchema(
  z.object({
    tasks: z.array(taskSchema),
  }),
);

export const listHistoryResultSchema = resultSchema(
  z.object({
    entries: z.array(historyEntrySchema),
  }),
);

export const createProjectResultSchema = resultSchema(
  z.object({
    projectId: z.string(),
  }),
);

export const createTaskResultSchema = resultSchema(
  z.object({
    taskId: z.string(),
  }),
);

export const acknowledgementResultSchema = resultSchema(
  z.object({
    acknowledged: z.literal(true),
  }),
);

export const projectMutationInputSchema = {
  projectId: z.string().describe('Project document id'),
};

export const taskMutationInputSchema = {
  projectId: z.string().describe('Parent project document id'),
  taskId: z.string().describe('Task document id'),
};

export const createProjectInputSchema = {
  name: z.string().describe('Project name'),
  description: z.string().describe('Project description, empty string allowed'),
};

export const updateProjectInputSchema = {
  projectId: z.string().describe('Project document id'),
  name: z.string().describe('Project name'),
  description: z.string().describe('Project description, empty string allowed'),
  archived: z.boolean().describe('Whether the project is archived'),
};

export const createTaskInputSchema = {
  projectId: z.string().describe('Parent project document id'),
  title: z.string().describe('Task title'),
  notes: z.string().describe('Task notes, empty string allowed'),
  status: taskStatusSchema.describe('Task status'),
  dueDate: z
    .string()
    .describe('Due date as YYYY-MM-DD or empty string when not set'),
};

export const updateTaskInputSchema = {
  projectId: z.string().describe('Parent project document id'),
  taskId: z.string().describe('Task document id'),
  title: z.string().describe('Task title'),
  notes: z.string().describe('Task notes, empty string allowed'),
  status: taskStatusSchema.describe('Task status'),
  dueDate: z
    .string()
    .describe('Due date as YYYY-MM-DD or empty string when not set'),
};

export const changeTaskStatusInputSchema = {
  projectId: z.string().describe('Parent project document id'),
  taskId: z.string().describe('Task document id'),
  status: taskStatusSchema.describe('Next task status'),
};

function resultSchema<T extends z.ZodType>(dataSchema: T) {
  return z
    .object({
      ok: z.boolean(),
      error: mutationErrorSchema.optional(),
      data: dataSchema.optional(),
    })
    .superRefine((value, context) => {
      if (value.ok) {
        if (typeof value.data === 'undefined') {
          context.addIssue({
            code: 'custom',
            message: 'ok=true results must include data.',
            path: ['data'],
          });
        }

        if (typeof value.error !== 'undefined') {
          context.addIssue({
            code: 'custom',
            message: 'ok=true results must not include error.',
            path: ['error'],
          });
        }

        return;
      }

      if (typeof value.error === 'undefined') {
        context.addIssue({
          code: 'custom',
          message: 'ok=false results must include error.',
          path: ['error'],
        });
      }

      if (typeof value.data !== 'undefined') {
        context.addIssue({
          code: 'custom',
          message: 'ok=false results must not include data.',
          path: ['data'],
        });
      }
    });
}
