AGENTS.md
=========

0. Purpose

----------

This repository builds **taskapi（タスカピ）**, a personal task management web app designed for future MCP integration.

This file defines the mandatory development process, role separation, delivery quality bar, and repository-wide implementation rules so that Codex can proceed with minimal ambiguity.

The goal is not just to make the app work, but to make it:

* correct against requirements,

* safe to extend,

* easy to review,

* easy to debug,

* consistent across all changes.

* * *

1. Product Definition

---------------------

### 1.1 Product name

* Official name: **taskapi**

* Reading / nickname: **タスカピ**

### 1.2 Product concept

A **single-user**, Google-login-based, PWA task management SPA backed by Firebase, with project/task CRUD, history retention, restore capability, and future MCP connectivity.

### 1.3 Non-negotiable product requirements

The following are **hard requirements**. Do not change, weaken, or reinterpret them unless explicitly instructed by the user.

1. The app is for **single-user personal use only**.

2. **Multi-user collaboration is out of scope**.

3. **Task assignee / user assignment must not exist** in UI, data model, or API.

4. Authentication uses **Google Sign-In via Firebase Authentication**.

5. The same Google account must see the same data across devices.

6. The app must remember login state and reopen to the authenticated home screen unless the user explicitly logs out.

7. The app is a **SPA**.

8. During initial load and key data-loading states, **skeleton screens must be shown**.

9. The app must be **PWA-installable**.

10. Data must be stored using **Cloud Firestore**.

11. Hosting uses **Firebase Hosting**.

12. Change history must be retained.

13. The app must support restoring a previous state from history.

14. The design must keep future **MCP integration** straightforward.

If any implementation idea conflicts with these, the implementation idea must be rejected.

* * *

2. Technical Baseline

---------------------

Use the following defaults unless there is a strong repo-specific reason to change them.

### 2.1 Frontend

* React

* TypeScript

* Vite

* pnpm

* React Router

* Firebase Web SDK

* Responsive UI for mobile-first usage

### 2.2 Backend / API

* Node.js

* TypeScript

* Cloud Run for API and MCP surface

* Firebase Admin SDK for privileged server-side operations

### 2.3 Data

* Firebase Authentication

* Cloud Firestore

### 2.4 Delivery and quality

* ESLint

* Prettier

* Vitest for unit tests

* Playwright for UI / flow validation where practical

Do not introduce large, opinionated new frameworks without strong justification.

* * *

3. Architecture Principles

--------------------------

### 3.1 Separation of concerns

Keep the following concerns separate:

* UI rendering

* client-side state handling

* domain logic

* persistence logic

* history / restore logic

* external integration logic (future MCP)

### 3.2 Source of truth

* Firestore is the persistent source of truth.

* Do not treat browser local state as authoritative.

* Client cache is a UX optimization only.

### 3.3 Write path policy

Prefer this rule:

* **Reads** may come directly from Firestore where appropriate.

* **Writes** should go through controlled server-side logic when consistency matters, especially for history retention and restore.

If a write changes current state, the change must also preserve the audit/history requirement.

### 3.4 History integrity

Any create, update, delete, or restore behavior must be designed so that:

* current state remains valid,

* history remains reconstructable,

* restore behavior is deterministic,

* user data is not silently lost.

### 3.5 Simplicity over premature abstraction

The app is single-user. Do not over-engineer for tenants, teams, permissions, or assignees.  
Build only what supports the defined requirements and near-term extensibility.

* * *

4. Core Domain Rules

--------------------

### 4.1 User model

The system assumes one authenticated end user per dataset scope.  
All user-owned data must be associated with the authenticated Firebase `uid`.

### 4.2 Project rules

A project:

* belongs to exactly one owner,

* may contain multiple tasks,

* can be created, updated, deleted, and restored,

* must maintain history.

### 4.3 Task rules

A task:

* belongs to exactly one project,

* belongs indirectly to exactly one owner,

* can be created, updated, deleted, and restored,

* must **not** have assignee fields,

* must maintain history.

### 4.4 Delete rules

Prefer logical delete over physical delete when restore is required.  
Delete behavior must never make restore impossible.

### 4.5 Restore rules

Restore must be explicit and traceable.  
A restore action must itself generate a history entry.

* * *

5. Required Development Order

-----------------------------

When bootstrapping or extending this product, proceed in this order unless a task explicitly targets another layer.

### Phase 1: Foundation

1. Initialize frontend scaffold.

2. Configure TypeScript, lint, format, test base.

3. Add Firebase project integration points.

4. Add routing and layout shell.

5. Add design tokens / shared UI primitives.

### Phase 2: Authentication

1. Implement Firebase Auth with Google Sign-In.

2. Implement persisted login behavior.

3. Implement auth bootstrap state.

4. Implement correct redirect behavior.

5. Implement skeleton / loading state during auth resolution.

### Phase 3: Data model

1. Define Firestore collections / document shapes.

2. Define TypeScript domain types.

3. Define runtime validation where needed.

4. Define repository/service boundaries.

### Phase 4: Project management

1. Project list view.

2. Project create flow.

3. Project edit flow.

4. Project delete flow.

5. Empty states and skeletons.

### Phase 5: Task management

1. Task list view under project.

2. Task create flow.

3. Task edit flow.

4. Task delete flow.

5. Status handling.

6. Empty states and skeletons.

### Phase 6: History and restore

1. History persistence model.

2. History retrieval.

3. Restore flow.

4. Validation of restore consistency.

5. UI for history browsing.

### Phase 7: Server-side consistency layer

1. Introduce controlled write APIs.

2. Ensure writes also persist history.

3. Protect user ownership.

4. Normalize success/error responses.

### Phase 8: PWA

1. Manifest.

2. Icons.

3. Service worker.

4. Installability checks.

5. Offline shell behavior as appropriate.

### Phase 9: MCP readiness

1. Refactor business logic for reuse.

2. Define tool-facing service methods.

3. Define MCP tool contracts.

4. Add MCP surface only after core app behavior is stable.

Do not start with MCP before the app’s core domain behavior is stable.

* * *

6. Mandatory Multi-Agent Workflow

---------------------------------

All meaningful feature work must use the following multi-agent roles.  
Each role has a distinct responsibility. Do not collapse them mentally into one vague pass.

### 6.1 Roles

#### A. Implementer

Responsible for:

* understanding the target scope,

* making the code change,

* adding tests,

* documenting assumptions,

* preparing the change for review.

#### B. Code Quality Reviewer

Responsible for checking:

* code clarity,

* naming,

* architecture consistency,

* separation of concerns,

* type safety,

* error handling,

* test quality,

* maintainability,

* unnecessary complexity.

This reviewer does **not** decide product correctness alone.

#### C. Requirement Reviewer

Responsible for checking:

* whether the change satisfies the actual user requirements,

* whether any non-negotiable requirements were violated,

* whether the UX behavior matches the intended flows,

* whether the implementation added out-of-scope behavior.

This reviewer checks the change against product intent, not just code style.

#### D. Debugger

Responsible for:

* running the app,

* validating the actual screen behavior,

* reproducing issues,

* testing key happy-path and failure-path flows,

* catching integration bugs invisible in static review.

Debugger outputs must be based on actual observed behavior whenever possible.

#### E. Triage Judge

Responsible for:

* collecting all findings from reviewers and debugger,

* classifying each issue as required / optional / reject,

* removing low-value or out-of-scope feedback,

* resolving conflicting review comments.

This role prevents overcorrection and review thrash.

#### F. Fix Planner

Responsible for:

* turning accepted findings into a concrete repair plan,

* ordering fixes by risk and dependency,

* defining the smallest safe patch set,

* ensuring the rework remains aligned with requirements.

This role converts judgment into action.

* * *

7. Review Contract Per Change

-----------------------------

For every non-trivial change, produce outputs in the following order.

### Step 1: Implementer summary

Must state:

* what changed,

* why it changed,

* what assumptions were made,

* what remains intentionally out of scope.

### Step 2: Code Quality Review

Must report findings by severity:

* Critical

* Major

* Minor

* Nit

Each finding must include:

* title,

* impacted files or modules,

* why it matters,

* suggested action.

### Step 3: Requirement Review

Must explicitly verify:

* single-user assumption preserved,

* no assignee feature introduced,

* login persistence behavior preserved if touched,

* SPA behavior preserved if touched,

* skeleton behavior preserved if touched,

* Firebase / Firestore assumptions preserved if touched,

* history / restore preserved if touched.

It must clearly say either:

* **Pass**

* **Pass with conditions**

* **Fail**

### Step 4: Debugger report

Must include:

* flows tested,

* environment used,

* observed behavior,

* defects found,

* reproduction steps.

### Step 5: Triage judgment

Every finding from review/debug must be labeled as one of:

* **Required before merge**

* **Can defer**

* **Reject recommendation**

The judge must explain why.

### Step 6: Fix plan

Must include:

* ordered list of accepted fixes,

* rationale for order,

* regression risks,

* retest scope.

Only after this should rework proceed.

* * *

8. Merge Request Quality Bar

----------------------------

A merge request is not ready unless all of the following are true.

### 8.1 Functional quality

* The targeted feature works end-to-end.

* No known requirement-breaking bug remains.

* Core UX flow is coherent.

### 8.2 Requirement quality

* The MR stays within scope.

* The MR does not add speculative features unless explicitly requested.

* Hard requirements remain intact.

### 8.3 Code quality

* Naming is clear.

* Types are not vague without reason.

* Logic is not duplicated without reason.

* Side effects are isolated.

* Error handling is meaningful.

* Dead code is removed.

### 8.4 Test quality

* Added or changed logic has appropriate tests where practical.

* Critical flows are manually validated if automation is not yet available.

### 8.5 Debug quality

* At least one actual runtime validation has been performed for UI-affecting changes.

### 8.6 Documentation quality

* If architecture, setup, or workflow changed, docs are updated.

* * *

9. Required Output Style for Agents

-----------------------------------

All agent personas should produce concise, structured, decision-oriented outputs.  
Avoid vague praise. Prefer specific findings and actions.

### 9.1 Reviewer rules

Reviewers must not say only “looks good”.  
They must either:

* identify concrete issues, or

* explicitly state what they checked and why it passed.

### 9.2 Debugger rules

Debugger must distinguish:

* not tested,

* could not reproduce,

* reproduced,

* confirmed fixed.

### 9.3 Triage rules

Triage must prevent unnecessary churn.  
Not all review comments deserve code changes.  
A suggestion that increases scope, complexity, or future burden without requirement value should usually be rejected or deferred.

### 9.4 Fix planner rules

Fix plans must be incremental and dependency-aware.  
Do not produce broad rewrites when targeted repairs are sufficient.

* * *

10. Definition of Done

----------------------

A task is done only when all of the following are true.

1. The implementation satisfies the scoped requirement.

2. Tests are added or updated where practical.

3. Relevant UI states are covered, including loading and error states.

4. Skeleton behavior exists where the touched feature loads asynchronously.

5. Review roles have completed their checks.

6. Triage has classified findings.

7. Accepted fixes are applied.

8. Runtime validation has been performed for UI-impacting work.

9. No hard requirement is violated.

* * *

11. UI and UX Rules

-------------------

### 11.1 Mobile-first

Design for smartphone usage first, then expand gracefully to larger screens.

### 11.2 Skeleton screens

Skeletons are required for:

* auth bootstrap,

* project list loading,

* project detail loading,

* task list loading,

* history loading,  
  where the user would otherwise see blank or unstable layout.

### 11.3 Empty states

Every major list view should have an intentional empty state.

### 11.4 Destructive actions

Delete and restore flows must use clear confirmation UI where appropriate.

### 11.5 No misleading placeholders

Do not show fake assignee UI, fake collaboration hints, or future-feature noise.

* * *

12. Data and Security Rules

---------------------------

### 12.1 Ownership

Every project, task, and history record must be scoped to the authenticated user.

### 12.2 Validation

Never trust client input blindly.  
Validate all write payloads appropriately.

### 12.3 Secrets

Never commit secrets.  
Use environment variables and documented setup procedures.

### 12.4 Firestore rules

Security rules must reflect owner-only access assumptions.

### 12.5 Restore safety

Restore must not create orphaned tasks, corrupted project links, or impossible states.

* * *

13. Git and Change Strategy

---------------------------

### 13.1 Small, reviewable changes

Prefer small MR units with clear scope.  
Avoid giant mixed-purpose changes.

### 13.2 One concern per change

Do not combine unrelated refactor, feature, and styling changes unless necessary.

### 13.3 Preserve history clarity

Commit and MR descriptions should explain intent, not just code motion.

* * *

14. Implementation Guardrails

-----------------------------

Do not introduce the following unless explicitly requested:

* team features,

* member invitations,

* assignees,

* role-based access control,

* comments system,

* attachments,

* notifications,

* calendar sync,

* subtask system,

* tags or labels,

* heavy state libraries if simple local/domain state is sufficient.

Do not optimize for hypothetical enterprise requirements.  
Optimize for correctness, simplicity, and MCP-ready structure.

* * *

15. Preferred Repository Structure

----------------------------------

Use a structure in this spirit:
    src/
      app/
      pages/
      features/
        auth/
        projects/
        tasks/
        history/
      components/
      lib/
      services/
      hooks/
      types/
      routes/
    server/
      api/
      domain/
      persistence/
      mcp/
    docs/
      requirements/
      plans/

Exact naming may vary, but separation must remain clear.

* * *

16. When to Stop and Ask

------------------------

Stop and request clarification only when one of these is true:

* two requirements directly conflict,

* a change would permanently alter hard requirements,

* external credentials or environment details are missing,

* the requested behavior is materially ambiguous and multiple choices would change product behavior.

Otherwise, make the best grounded decision consistent with this file and the requirements.

* * *

17. Final Priority Order

------------------------

When tradeoffs occur, prioritize in this order:

1. Explicit user requirements

2. Hard product constraints in this file

3. Data integrity

4. Security and ownership correctness

5. End-user clarity and UX

6. Maintainability

7. Speed of implementation

8. Future extensibility

* * *

18. Operating Principle

-----------------------

Build **taskapi** as a calm, reliable, single-user product.  
Every change should make the app feel:

* simpler,

* safer,

* clearer,

* more recoverable,

* more ready for future AI-assisted operation.

When in doubt, choose the design that preserves requirement fidelity, keeps history trustworthy, and reduces future confusion.
