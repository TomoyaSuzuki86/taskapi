# taskapi

Auth-session foundation for `taskapi`, a single-user task management SPA designed for Firebase-backed Google sign-in, persisted session handling, Firestore persistence, history retention, restore, and future MCP integration.

## Governing docs

- [AGENTS.md](/C:/Users/tomo1/Documents/taskapi/AGENTS.md)
- [Requirements](/C:/Users/tomo1/Documents/taskapi/docs/requirements/taskapi.md)
- [Bootstrap exec plan](/C:/Users/tomo1/Documents/taskapi/docs/plans/bootstrap-execplan.md)

## Current phase scope

Implemented in this phase:

- React + TypeScript + Vite SPA scaffold
- React Router shell with authenticated and unauthenticated route handling
- Mobile-first layout primitives
- Skeleton components for auth bootstrap loading states
- Firebase client initialization boundary and environment contract
- Firebase Authentication with Google sign-in
- persisted auth session handling and logout
- domain type scaffolding for user, project, task, and history
- ESLint, Prettier, and Vitest baseline

Explicitly deferred:

- Firestore reads and writes beyond auth session handling
- project/task CRUD
- history persistence and restore
- server-side write APIs
- PWA finalization
- MCP implementation

## Directory structure

```text
src/
  app/          App shell and top-level tests
  components/   Reusable UI, layout, and skeleton primitives
  features/     Feature folders with bootstrap placeholders
  lib/          Firebase configuration/init boundaries
  pages/        Route-level placeholder screens
  routes/       Router setup and route smoke tests
  services/     Future client-side service contracts
  styles/       Global tokens and layout styles
  test/         Shared test setup
  types/        Domain and environment typings
server/         Placeholder server boundaries for later phases
docs/           Requirements and implementation plans
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
```

The app requires real Firebase web app credentials for auth-session behavior. Missing values block auth bootstrap with a clear error screen.

## Firebase Auth setup

Required Firebase console configuration:

1. Enable `Google` in Firebase Authentication sign-in providers.
2. Add your local development origin to the Firebase authorized domains list.
3. Use the Firebase web app configuration in `.env.local`.

If Google sign-in fails with an unauthorized-domain error, check the authorized domains configuration first.

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
5. Run `pnpm dev`.
6. Open the local Vite URL in a browser.

## Next phase

The next recommended phase is the Firestore data model and data access foundation, which should add:

- collection/document structure
- owner-scoped data conventions
- repository boundaries for Firestore reads
- history document shape and restore-safe design
