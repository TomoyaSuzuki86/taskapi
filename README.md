# taskapi

Bootstrap foundation for `taskapi`, a single-user task management SPA designed for future Firebase-backed auth, Firestore persistence, history retention, restore, and MCP integration.

## Governing docs

- [AGENTS.md](/C:/Users/tomo1/Documents/taskapi/AGENTS.md)
- [Requirements](/C:/Users/tomo1/Documents/taskapi/docs/requirements/taskapi.md)
- [Bootstrap exec plan](/C:/Users/tomo1/Documents/taskapi/docs/plans/bootstrap-execplan.md)

## Bootstrap scope

Implemented in this phase:

- React + TypeScript + Vite SPA scaffold
- React Router shell with placeholder routes
- Mobile-first layout primitives
- Skeleton components for bootstrap and project-list loading states
- Firebase client initialization boundary and environment contract
- Domain type scaffolding for user, project, task, and history
- ESLint, Prettier, and Vitest baseline

Explicitly deferred:

- Google sign-in
- persisted auth session behavior
- Firestore reads and writes
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

Bootstrap does not require real Firebase credentials to render the shell, but the app surfaces whether configuration is present so the auth phase can start without restructuring.

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
3. Run `pnpm dev`.
4. Open the local Vite URL in a browser.

## Next phase

The next recommended phase is `auth-session-execplan`, which should add:

- Firebase Google sign-in
- auth bootstrap state
- persisted login behavior
- auth-aware routing and redirects
- skeleton handling during auth resolution
