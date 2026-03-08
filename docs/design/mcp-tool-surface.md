MCP Tool Surface Plan
=====================

1. Purpose
----------

This document defines the transport-agnostic taskapi surface and the minimal MCP transport now implemented for taskapi.

Current scope:

* keep the web app behavior unchanged,
* keep Firebase callable Functions as the active app transport for writes,
* keep client-side Firestore reads unchanged for the SPA,
* expose stable machine-oriented contracts through a minimal MCP stdio server that reuses the same application services.

Out of scope for this phase:

* auth redesign,
* replacing app reads with server queries,
* collaboration or assignee concepts.

2. Architecture shape
---------------------

The reusable server-side surface separates three concerns under `functions/src/`:

* `application/`
  * `TaskapiMutationUseCases` for write operations with history-safe transactions
  * `TaskapiQueryService` for machine-facing read operations
* `domain/`
  * typed result/error contracts
  * validation and authenticated-uid derivation
* `transport/`
  * Firebase callable handler adapters that convert auth + payload input into shared service calls

The minimal MCP transport lives under `server/mcp/` and reuses the same `application/` services plus the same domain validation rules.

The MCP transport must call the same `application/` services, not reimplement project/task/history rules in separate glue code.

3. Stable result contract
-------------------------

All transport-agnostic operations return the same discriminated result shape:

```ts
type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: MutationErrorCode; message: string } };
```

Supported machine error codes:

* `UNAUTHENTICATED`
* `PERMISSION_DENIED`
* `INVALID_ARGUMENT`
* `NOT_FOUND`
* `FAILED_PRECONDITION`
* `INTERNAL`

Contract rule:

* shared use-case/query services should return `ok: false` results for domain/validation failures,
* transport adapters may still catch unexpected exceptions, but callers should not depend on thrown errors for normal contract handling.

4. Mutation use cases
---------------------

The following reusable mutation entry points are prepared for future MCP tools:

```ts
createProject(uid, { name, description })
updateProject(uid, { projectId, name, description, archived })
deleteProject(uid, { projectId })
restoreProject(uid, { projectId })
createTask(uid, { projectId, title, notes, status, dueDate })
updateTask(uid, { projectId, taskId, title, notes, status, dueDate })
deleteTask(uid, { projectId, taskId })
restoreTask(uid, { projectId, taskId })
changeTaskStatus(uid, { projectId, taskId, status })
```

Behavior guarantees:

* project/task ownership remains scoped by authenticated Firebase `uid`
* task writes require an active parent project
* delete/restore operations append history entries
* project delete cascades logical task delete + history writes
* restore remains explicit and traceable

5. Query services
-----------------

The following reusable read services are prepared for future MCP-facing access:

```ts
listProjects(uid)
getProject(uid, projectId)
listTasks(uid, projectId)
listDeletedProjects(uid)
listDeletedTasks(uid, projectId)
listHistory(uid)
```

These queries are intentionally read-only and machine-oriented.
They do not change the current app architecture, which still reads directly from Firestore on the client.

6. Tool schema plan
-------------------

The implemented MCP tool names use stable snake_case names:

```ts
type TaskapiToolName =
  | 'list_projects'
  | 'get_project'
  | 'create_project'
  | 'update_project'
  | 'delete_project'
  | 'restore_project'
  | 'list_tasks'
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'restore_task'
  | 'change_task_status'
  | 'list_history';
```

MCP request/response rule:

* request payloads should match the shared validated payload types exactly,
* responses should preserve the `MutationResult<T>` envelope unchanged,
* tool callers should branch on `ok` and then inspect `error.code`.

7. Example schemas
------------------

Create project:

```json
{
  "name": "Release prep",
  "description": "Track remaining launch work"
}
```

Create project result:

```json
{
  "ok": true,
  "data": {
    "projectId": "proj_123"
  }
}
```

Restore task failure:

```json
{
  "ok": false,
  "error": {
    "code": "FAILED_PRECONDITION",
    "message": "Restore the parent project before changing its tasks."
  }
}
```

List history result:

```json
{
  "ok": true,
  "data": {
    "entries": [
      {
        "id": "hist_123",
        "entityType": "task",
        "entityId": "task_456",
        "projectId": "proj_123",
        "action": "update",
        "title": "Draft MCP contracts",
        "createdAt": "2026-03-08T09:00:00.000Z"
      }
    ]
  }
}
```

8. Transport implementation
---------------------------

Firebase callable Functions remain the active app transport.
The MCP server is a separate stdio transport for machine callers.

The MCP transport currently:

1. resolves one configured Firebase owner `uid`
2. validates incoming tool payloads with the same shared validators
3. invokes the shared `application/` services
4. converts validation and domain errors into the shared `MutationResult<T>` envelope
5. returns the same machine-oriented envelope as MCP `structuredContent`

This keeps callable Functions and MCP tools behaviorally aligned without changing the current SPA flow.
