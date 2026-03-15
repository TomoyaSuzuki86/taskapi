# taskapi

Installable PWA for `taskapi`, a single-user task management SPA with Firebase-backed Google sign-in, client-side Firestore reads, server-side callable writes, history retention, and restore support.

## Governing docs

- [AGENTS.md](/C:/Users/tomo1/Documents/taskapi/AGENTS.md)
- [Requirements](/C:/Users/tomo1/Documents/taskapi/docs/requirements/taskapi.md)
- [Auth session exec plan](/C:/Users/tomo1/Documents/taskapi/docs/plans/auth-session-execplan.md)

## Current phase scope

Implemented in this phase:

- Firebase Authentication with persisted Google sign-in
- SPA route protection and mobile-first UI shell
- client-side Firestore reads for projects, tasks, and history
- soft-delete-aware history/restore MVP
- callable Firebase Functions for all project/task mutations
- server-side input validation and authenticated uid derivation
- atomic mutation + history writes through Admin SDK transactions
- tighter Firestore rules that block direct client writes to project/task/history data
- generated web manifest, installable icons, and standalone display metadata
- service worker precaching for the app shell and essential static assets
- offline startup/navigation support for already-cached assets
- graceful offline messaging for network-required mutations
- repository/service boundaries that keep pages free of Firebase write logic
- ESLint, Prettier, and Vitest coverage for client/server/PWA wiring

Explicitly deferred:

- full MCP transport/server implementation
- advanced filtering/sorting
- arbitrary historical revision rollback
- offline write queueing or conflict resolution

## Directory structure

```text
src/
  app/          App shell and top-level tests
  components/   Reusable UI, layout, and skeleton primitives
  features/     Feature folders for auth, projects, tasks, history, and PWA hooks
  lib/          Firebase configuration/init boundaries
  pages/        Route-level SPA screens
  routes/       Router setup and route smoke tests
  services/     Firestore reads and callable write clients
  styles/       Global tokens and layout styles
  test/         Shared test setup
  types/        Domain, env, and mutation contract types
functions/      Firebase callable transport plus shared application/domain services
server/         Legacy server-oriented references kept for local review/type-check coverage
docs/           Requirements and implementation plans
firestore.rules Owner-only read rules with client writes disabled
public/         PWA icons and static assets
```

## Environment variables

Create `.env.local` from `.env.example`.

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
```

The app requires real Firebase web app credentials. Missing values block Firebase initialization with a clear error state.

## Firebase Auth setup

Required Firebase console configuration:

1. Enable `Google` in Firebase Authentication sign-in providers.
2. Add your local development origin to the Firebase authorized domains list.
3. Use the Firebase web app configuration in `.env.local`.

If Google sign-in fails with an unauthorized-domain error, check the authorized domains configuration first.

## Firestore setup

This phase expects Cloud Firestore and Firebase Functions to be enabled for the same Firebase project.

Required data paths:

- `users/{uid}/projects/{projectId}`
- `users/{uid}/projects/{projectId}/tasks/{taskId}`
- `users/{uid}/history/{historyEntryId}`

Local and deployed rules should use [firestore.rules](/C:/Users/tomo1/Documents/taskapi/firestore.rules).

## Firebase Functions setup

Mutations now flow through callable Firebase Functions exported from [index.ts](/C:/Users/tomo1/Documents/taskapi/functions/src/index.ts).
`functions/src` is the runtime source of truth for callable behavior; `server/` remains non-runtime compatibility/reference code only.

Required behavior:

1. deploy the callable functions with the same Firebase project as the web app
2. keep the deployed Functions region aligned with `VITE_FIREBASE_FUNCTIONS_REGION`
3. ensure the Functions runtime has permission to write Firestore via Admin SDK

## Scripts

```bash
pnpm install
pnpm dev
pnpm preview
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

## Local startup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Ensure Firebase Authentication -> Google provider is enabled.
4. Ensure your local dev host is authorized in Firebase Authentication.
5. Ensure Cloud Firestore is enabled for the project.
6. Deploy or emulate the callable Firebase Functions.
7. Run `pnpm dev`.
8. Open the local Vite URL in a browser.
9. Revisit the app once online so the service worker can cache the shell.

## PWA behavior

- installability is provided through the generated `manifest.webmanifest`
- `vite-plugin-pwa` generates the service worker and precache manifest at build time
- already-cached app shell routes can reopen offline
- mutations remain online-only and show a clear offline error when the browser is disconnected

## MCP readiness

The MCP-readiness refactor keeps current app behavior unchanged while preparing a transport-agnostic server surface for future tools.

- shared mutation use cases live in [taskapi-mutation-use-cases.ts](/C:/Users/tomo1/Documents/taskapi/functions/src/application/taskapi-mutation-use-cases.ts)
- shared query services live in [taskapi-query-service.ts](/C:/Users/tomo1/Documents/taskapi/functions/src/application/taskapi-query-service.ts)
- callable transport adapters live in [callable-handlers.ts](/C:/Users/tomo1/Documents/taskapi/functions/src/transport/callable-handlers.ts)
- the planned MCP tool surface is documented in [mcp-tool-surface.md](/C:/Users/tomo1/Documents/taskapi/docs/design/mcp-tool-surface.md)

## Remote MCP deployment

The repo now includes a minimal Cloud Run-ready container for the remote MCP HTTP transport.

Local start:

```bash
TASKAPI_MCP_UID=<firebase-auth-uid> pnpm mcp:http:start
```

Cloud Run example:

```bash
gcloud run deploy taskapi-mcp \
  --project taskapi-489600 \
  --region asia-northeast1 \
  --source . \
  --allow-unauthenticated \
  --set-env-vars TASKAPI_MCP_UID=<firebase-auth-uid>,TASKAPI_MCP_HOST=0.0.0.0,TASKAPI_MCP_PATH=/mcp,TASKAPI_MCP_PUBLIC_BASE_URL=<https-base-url>,TASKAPI_MCP_OAUTH_APPROVAL_SECRET=<single-user-secret>,TASKAPI_MCP_OAUTH_TOKEN_SECRET=<long-random-secret>
```

Notes:

- Cloud Run injects `PORT`, and the MCP HTTP server already uses it.
- `TASKAPI_MCP_HOST=0.0.0.0` is required on Cloud Run so the container listener is reachable from the platform health checks.
- The current transport is single-user and bound to one fixed Firebase `uid`.
- ChatGPT connectivity needs a public HTTPS endpoint, so the service itself remains publicly reachable while `/mcp` is protected by OAuth bearer tokens.
- `TASKAPI_MCP_PUBLIC_BASE_URL` must match the public HTTPS origin that ChatGPT will reach.
- `TASKAPI_MCP_OAUTH_APPROVAL_SECRET` is the single-user secret shown on the approval page during OAuth authorization.
- `TASKAPI_MCP_OAUTH_TOKEN_SECRET` is used to sign access and refresh tokens. Rotate it if exposed.
- ChatGPT registration should point at `<https-base-url>/mcp` and use `OAuth`, not `No Authentication`.
