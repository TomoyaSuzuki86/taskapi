ExecPlan: Bootstrap Foundation for taskapi
==========================================

1. Plan metadata

----------------

* Plan name: `bootstrap-foundation`

* Target product: **taskapi（タスカピ）**

* Plan type: initial implementation / foundation

* Status: draft

* * *

2. Objective

------------

Build the initial repository foundation for **taskapi** so that future feature work can proceed without ambiguity.

This phase must establish the base application shell, tooling, structure, and conventions needed for the later phases defined in `AGENTS.md` and `docs/requirements/taskapi.md`.

This phase is not about shipping the full product. It is about creating a clean, stable, reviewable starting point.

* * *

3. Why this phase exists

------------------------

Without a solid bootstrap phase, later work tends to drift in architecture, code style, routing, Firebase integration shape, and UI behavior.

This plan creates the minimum foundation necessary to support:

* auth bootstrap UX,

* mobile-first SPA structure,

* Firebase integration setup,

* shared UI primitives,

* future project/task/history features,

* future controlled write APIs,

* future MCP integration.

* * *

4. Scope

--------

### 4.1 In scope

This plan includes:

* frontend scaffold creation

* TypeScript setup

* pnpm workspace or single-package setup as appropriate

* lint/format/test baseline

* React Router setup

* top-level app shell

* base layout system

* mobile-first responsive frame

* skeleton screen primitives

* Firebase client integration entry points

* environment variable contract

* shared type and service boundaries for future work

* repository structure setup

* developer documentation for local startup

### 4.2 Explicitly out of scope

This plan does **not** include:

* full Google sign-in implementation

* Firestore reads/writes for real data

* project CRUD

* task CRUD

* history persistence

* restore behavior

* server write APIs

* MCP server implementation

* PWA finalization

Bootstrap may include placeholders or stubs for these areas, but not production-complete implementations.

* * *

5. Inputs and governing docs

----------------------------

Implementation must follow:

* `AGENTS.md`

* `docs/requirements/taskapi.md`

If there is a conflict, priority order is:

1. explicit user instructions,

2. hard requirements in `AGENTS.md`,

3. `docs/requirements/taskapi.md`,

4. this ExecPlan.

* * *

6. Success criteria

-------------------

This plan is complete only when all of the following are true:

1. The app starts locally with a clear repository structure.

2. The app renders a stable SPA shell.

3. Routing works for at least placeholder screens.

4. Mobile-first layout is established.

5. Skeleton UI primitives exist and are used in at least one loading shell.

6. Firebase client initialization structure exists.

7. Environment variable expectations are documented.

8. Lint, format, and test commands run successfully.

9. The repository is ready for the authentication phase without structural rework.

* * *

7. Deliverables

---------------

### 7.1 Code deliverables

* app scaffold

* routing scaffold

* layout scaffold

* shared UI primitives

* skeleton components

* Firebase client setup module

* env example file or env documentation

* lint config

* formatter config

* test config

### 7.2 Documentation deliverables

* `README.md` update with local startup instructions

* directory structure explanation

* environment variable list

* brief note describing intended next phase

* * *

8. Proposed repository structure

--------------------------------

Use a structure in this spirit.  
Exact file names may vary slightly, but responsibilities must stay clean.
    .
    ├─ src/
    │  ├─ app/
    │  ├─ routes/
    │  ├─ pages/
    │  ├─ features/
    │  │  ├─ auth/
    │  │  ├─ projects/
    │  │  ├─ tasks/
    │  │  └─ history/
    │  ├─ components/
    │  │  ├─ ui/
    │  │  ├─ layout/
    │  │  └─ skeleton/
    │  ├─ lib/
    │  ├─ services/
    │  ├─ hooks/
    │  ├─ types/
    │  └─ styles/
    ├─ server/
    │  ├─ api/
    │  ├─ domain/
    │  ├─ persistence/
    │  └─ mcp/
    ├─ docs/
    │  ├─ requirements/
    │  └─ plans/
    ├─ public/
    └─ tests/

If the initial implementation starts frontend-only, keep `server/` as an intentional empty placeholder with a brief README or `.gitkeep`.

* * *

9. Work breakdown

-----------------

Workstream A: Project initialization
------------------------------------

### Goal

Create a clean frontend application baseline.

### Tasks

1. Initialize app with React + TypeScript + Vite.

2. Configure pnpm scripts.

3. Add basic editor/tooling files as needed.

4. Ensure local startup works.

### Done when

* `pnpm install` works

* `pnpm dev` runs

* `pnpm build` succeeds

* * *

Workstream B: Quality baseline
------------------------------

### Goal

Establish consistent static and test tooling.

### Tasks

1. Configure ESLint.

2. Configure Prettier.

3. Configure Vitest.

4. Add minimal smoke test coverage or render test.

5. Add scripts for lint, format, test.

### Done when

* `pnpm lint` passes

* `pnpm test` passes

* `pnpm format:check` or equivalent passes

* * *

Workstream C: App shell and routing
-----------------------------------

### Goal

Create the top-level SPA structure.

### Tasks

1. Set up React Router.

2. Create root app shell.

3. Add placeholder routes for:
   
   * home
   
   * project detail
   
   * history view or placeholder
   
   * settings/auth placeholder

4. Add not-found route.

### Done when

* route navigation works without full page reload

* layout remains stable between route changes

* * *

Workstream D: Layout and design primitives
------------------------------------------

### Goal

Create a clean mobile-first visual baseline.

### Tasks

1. Add base page container.

2. Add app header structure.

3. Add content section primitives.

4. Add button/input/card primitives or wrappers.

5. Add spacing/typography conventions.

### Done when

* placeholder screens are visually coherent on mobile and desktop

* layout primitives are reusable for later feature work

* * *

Workstream E: Skeleton system
-----------------------------

### Goal

Enforce non-blank loading behavior early.

### Tasks

1. Create generic skeleton block component.

2. Create list/card/page skeleton variants.

3. Wire skeleton into at least:
   
   * app bootstrap shell
   
   * project-list placeholder page

4. Ensure no obvious layout shift against target page structure.

### Done when

* app can display skeleton-based loading UI instead of blank screens

* skeleton variants are reusable for auth/projects/tasks/history

* * *

Workstream F: Firebase client entry points
------------------------------------------

### Goal

Prepare the codebase for upcoming auth/data integration.

### Tasks

1. Add Firebase SDK dependency.

2. Create Firebase app initialization module.

3. Create typed configuration access pattern.

4. Document required environment variables.

5. Fail clearly when configuration is missing in development.

### Done when

* there is a clear single place where Firebase is initialized

* future auth implementation can start without restructuring

* * *

Workstream G: Domain scaffolding
--------------------------------

### Goal

Create basic type and service boundaries without prematurely implementing full logic.

### Tasks

1. Add placeholder domain types for:
   
   * user
   
   * project
   
   * task
   
   * history

2. Add service interface stubs or notes for future repositories/services.

3. Ensure no assignee-related field appears anywhere.

### Done when

* type names and module boundaries support later phases

* no out-of-scope domain concepts are introduced

* * *

Workstream H: Documentation and onboarding
------------------------------------------

### Goal

Make the repository understandable to the next agent immediately.

### Tasks

1. Update README with setup steps.

2. Document required environment variables.

3. Document available scripts.

4. Document intended next phase.

5. Link to `AGENTS.md` and requirements doc.

### Done when

* a new implementer can clone the repo and start the app without guesswork

* * *

10. Implementation notes

------------------------

### 10.1 Styling direction

Use a simple, calm, mobile-first style.  
Do not over-design the bootstrap phase.  
Focus on consistency and reusable primitives.

### 10.2 State management direction

Do not introduce a heavy state library at bootstrap unless clearly necessary.  
Prefer React state/hooks and module boundaries that can evolve later.

### 10.3 Data direction

Do not hardcode domain data into long-term structures.  
Use mock/placeholder data only where needed to support shell rendering.

### 10.4 Server direction

Do not implement real server logic in bootstrap.  
Prepare structure only.

* * *

11. Risks and mitigations

-------------------------

### Risk 1: Overbuilding bootstrap

Problem:  
Bootstrap turns into partial feature implementation and creates architectural noise.

Mitigation:  
Keep scope strict. Only lay foundation.

### Risk 2: Premature Firebase coupling

Problem:  
Auth/data logic leaks into app shell too early.

Mitigation:  
Create clean initialization boundaries and placeholder contracts only.

### Risk 3: Skeleton mismatch

Problem:  
Skeleton UI is added late and no longer matches real layouts.

Mitigation:  
Add skeletons now, aligned to expected future screens.

### Risk 4: Hidden scope creep

Problem:  
Assignee, collaboration, or other out-of-scope concepts appear in types/components.

Mitigation:  
Requirement review must explicitly reject these.

* * *

12. Testing strategy for this phase

-----------------------------------

### 12.1 Automated

At minimum:

* app render smoke test

* route render smoke test if practical

* lint/type/test command verification

### 12.2 Manual

Validate:

* app starts locally

* navigation works

* placeholder pages render

* skeleton components render correctly

* responsive layout behaves reasonably on mobile width and desktop width

* * *

13. Review plan (mandatory)

---------------------------

This phase must follow the role flow defined in `AGENTS.md`.

### 13.1 Implementer summary must cover

* scaffold decisions

* chosen structure

* deferred items

### 13.2 Code Quality Reviewer must check

* clarity of structure

* lack of premature complexity

* reusable component boundaries

* config cleanliness

### 13.3 Requirement Reviewer must check

* single-user assumption preserved

* no assignee concept introduced

* SPA baseline exists

* skeleton requirement addressed

* Firebase direction preserved

* MCP readiness not blocked

### 13.4 Debugger must validate

* local startup

* route navigation

* loading shell behavior

* mobile viewport behavior

### 13.5 Triage Judge must classify

all review/debug findings into:

* required before merge

* can defer

* reject recommendation

### 13.6 Fix Planner must produce

an ordered patch plan before any rework if issues are found.

* * *

14. Merge checklist

-------------------

A bootstrap MR is mergeable only if all boxes below are effectively true:

* Repo boots locally

* Build succeeds

* Lint succeeds

* Tests succeed

* SPA routing exists

* Mobile-first shell exists

* Skeleton primitives exist and are used

* Firebase entry point exists

* Environment requirements are documented

* No assignee or collaboration concepts introduced

* README is updated

* Review roles completed

* Required findings resolved

* * *

15. Recommended first implementation sequence

---------------------------------------------

Use this exact order unless a repo-specific constraint forces a change.

1. initialize app scaffold

2. set up scripts and quality tooling

3. create app shell and router

4. add layout primitives

5. add skeleton primitives and wire them in

6. add Firebase init module and env contract

7. add domain type stubs

8. update README/docs

9. run review/debug cycle

10. apply required fixes only

* * *

16. Handoff to next phase

-------------------------

When this ExecPlan is complete, the next recommended plan is:

* `auth-session-execplan`

That next phase should implement:

* real Firebase Google login

* persistent auth session behavior

* auth-aware route entry behavior

* authenticated home flow

* auth loading skeleton state

* * *

17. Final rule

--------------

Bootstrap is successful when it reduces ambiguity for future work.  
If a change makes future auth/project/task/history work clearer and safer, it belongs here.  
If it tries to solve full product behavior already, it probably does not.
