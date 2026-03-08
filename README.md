# taskapi

Server-controlled write path for `taskapi`, a single-user task management SPA with Firebase-backed Google sign-in, client-side Firestore reads, history retention, and restore support.

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
- repository/service boundaries that keep pages free of Firebase write logic
- ESLint, Prettier, and Vitest coverage for client/server write paths

Explicitly deferred:

- PWA finalization
- MCP implementation
- advanced filtering/sorting
- arbitrary historical revision rollback

## Directory structure

```text
src/
  app/          App shell and top-level tests
  components/   Reusable UI, layout, and skeleton primitives
  features/     Feature folders for auth, projects, tasks, and history
  lib/          Firebase configuration/init boundaries
  pages/        Route-level SPA screens
  routes/       Router setup and route smoke tests
  services/     Firestore reads and callable write clients
  styles/       Global tokens and layout styles
  test/         Shared test setup
  types/        Domain, env, and mutation contract types
server/         Firebase Functions, domain write logic, and persistence paths
docs/           Requirements and implementation plans
firestore.rules Owner-only read rules with client writes disabled
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

Mutations now flow through callable Firebase Functions exported from [server/api/index.ts](/C:/Users/tomo1/Documents/taskapi/server/api/index.ts).

Required behavior:

1. deploy the callable functions with the same Firebase project as the web app
2. keep the deployed Functions region aligned with `VITE_FIREBASE_FUNCTIONS_REGION`
3. ensure the Functions runtime has permission to write Firestore via Admin SDK

## Scripts

```bash
pnpm install
pnpm dev
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

## Next phase

The next recommended phase is PWA completion, which should add:

- web manifest finalization
- installability verification
- service worker wiring
- offline shell behavior where appropriate
