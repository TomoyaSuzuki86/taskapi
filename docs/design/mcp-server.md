MCP Server Setup
================

1. Purpose
----------

taskapi now includes a minimal MCP stdio server under `server/mcp/`.

This transport:

* reuses the shared project/task/history use cases and query services,
* returns the same machine-oriented `MutationResult<T>` envelopes as callable Functions,
* does not change the SPA, PWA, auth flow, or client-side Firestore reads used by the app.

2. Entry point
--------------

Start the MCP server with:

```bash
pnpm mcp:start
```

The entrypoint is `server/mcp/index.ts`.

3. Required environment
-----------------------

Set the single-user owner uid before starting the server:

```bash
TASKAPI_MCP_UID=<firebase-auth-uid>
```

The MCP server is intentionally single-user.
It does not accept arbitrary caller-supplied user ids.

4. Firestore credentials
------------------------

The MCP server uses the Firebase Admin SDK through `getAdminFirestore()`.
Provide application default credentials before starting it.

Typical options:

* `gcloud auth application-default login`
* `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`

5. Implemented tools
--------------------

The current tool set is:

* `list_projects`
* `get_project`
* `create_project`
* `update_project`
* `delete_project`
* `restore_project`
* `list_tasks`
* `create_task`
* `update_task`
* `delete_task`
* `restore_task`
* `change_task_status`
* `list_history`

Each tool maps directly to shared application-layer services.
Validation remains centralized in `functions/src/domain/taskapi-validation.ts`.

6. Response contract
--------------------

All tools return the same stable envelope shape in MCP `structuredContent`:

```ts
type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: MutationErrorCode; message: string } };
```

Supported error codes:

* `UNAUTHENTICATED`
* `PERMISSION_DENIED`
* `INVALID_ARGUMENT`
* `NOT_FOUND`
* `FAILED_PRECONDITION`
* `INTERNAL`

7. Design constraints
---------------------

The MCP server must preserve these boundaries:

* callable Functions remain unchanged for the app transport
* client-side Firestore reads remain unchanged for the app
* validation and domain constraints stay in shared layers
* transport glue must not duplicate project/task/history rules
* collaboration and assignee concepts remain out of scope
