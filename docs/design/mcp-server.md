MCP Server Setup
================

1. Purpose
----------

taskapi now includes two MCP transports under `server/mcp/`:

* `stdio` for local MCP clients
* `streamable HTTP` for remote MCP clients such as ChatGPT Web developer mode

Both transports:

* reuse the shared project/task/history use cases and query services,
* return the same machine-oriented `MutationResult<T>` envelopes as callable Functions,
* do not change the SPA, PWA, auth flow, or client-side Firestore reads used by the app.

2. Entry points
---------------

Start the local stdio server:

```bash
pnpm mcp:start
```

Start the remote streamable HTTP server:

```bash
pnpm mcp:http:start
```

Entrypoints:

* `server/mcp/index.ts`
* `server/mcp/http-server.ts`

3. Required environment
-----------------------

Set the single-user owner uid before starting either transport:

```bash
TASKAPI_MCP_UID=<firebase-auth-uid>
```

The MCP server is intentionally single-user.
It does not accept arbitrary caller-supplied user ids.

Optional HTTP transport settings:

```bash
TASKAPI_MCP_HOST=127.0.0.1
TASKAPI_MCP_PORT=8787
TASKAPI_MCP_PATH=/mcp
```

`PORT` is also accepted as a fallback for the HTTP server.

Optional OAuth settings for the remote HTTP transport:

```bash
TASKAPI_MCP_PUBLIC_BASE_URL=https://taskapi-mcp.example.com
TASKAPI_MCP_OAUTH_APPROVAL_SECRET=<single-user-secret>
TASKAPI_MCP_OAUTH_TOKEN_SECRET=<long-random-secret>
```

When all three OAuth values are present, `/mcp` requires bearer tokens and the server exposes:

* `/.well-known/oauth-protected-resource/mcp`
* `/.well-known/oauth-authorization-server`
* `/register`
* `/authorize`
* `/token`
* `/oauth/approve`

4. Firestore credentials
------------------------

The MCP server uses the Firebase Admin SDK through `getAdminFirestore()`.
Provide application default credentials before starting it.

Typical options:

* `gcloud auth application-default login`
* `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`

5. ChatGPT compatibility
------------------------

OpenAI currently supports remote MCP servers in ChatGPT Web developer mode.
The ChatGPT mobile app does not support MCP apps.

That means:

* `pnpm mcp:start` is for local MCP clients only
* `pnpm mcp:http:start` is the transport shape needed for ChatGPT Web
* ChatGPT still needs a publicly reachable URL, so local HTTP usually needs a tunnel or deployment target
* ChatGPT should register the MCP endpoint as `OAuth`
* the current OAuth flow is single-user and gated by an approval secret page

Recommended local flow for ChatGPT Web testing:

1. Start the HTTP MCP server.
2. Expose it with a tunnel such as `ngrok` or a Cloud Run deployment.
3. Set `TASKAPI_MCP_PUBLIC_BASE_URL` to that public HTTPS origin.
4. In ChatGPT Web, enable developer mode and add the remote MCP server URL.
5. Choose `OAuth` during registration and complete the approval-secret step in the browser.

Current endpoint layout:

* `POST <base-url>/mcp`
* `GET <base-url>/health`
* `GET <base-url>/.well-known/oauth-protected-resource/mcp`
* `GET <base-url>/.well-known/oauth-authorization-server`

Unauthenticated `POST /mcp` returns `401` with `WWW-Authenticate` metadata when OAuth is enabled.
Authorized `GET` and `DELETE` on `/mcp` return `405 Method not allowed.` in this stateless setup.
`/health` intentionally stays global so probes remain stable even when `TASKAPI_MCP_PATH` changes.

If port `8787` is already occupied locally, set `TASKAPI_MCP_PORT` or `PORT` before starting the HTTP server.

6. Implemented tools
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

7. Response contract
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

8. Design constraints
---------------------

The MCP server must preserve these boundaries:

* callable Functions remain unchanged for the app transport
* client-side Firestore reads remain unchanged for the app
* validation and domain constraints stay in shared layers
* transport glue must not duplicate project/task/history rules
* collaboration and assignee concepts remain out of scope
