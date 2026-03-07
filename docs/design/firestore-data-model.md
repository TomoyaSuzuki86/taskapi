Firestore Data Model Design for taskapi
=======================================

1. Purpose

----------

This document defines the recommended Firestore data model for **taskapi（タスカピ）**.

The design must satisfy the product constraints:

* single-user personal use,

* Google-authenticated ownership,

* cross-device consistency,

* project/task CRUD,

* change history retention,

* restore capability,

* future MCP-ready architecture.

This document is the baseline for client types, repository design, server-side write logic, and Firestore security rules.

* * *

2. Design principles

--------------------

### 2.1 Owner-scoped data

All persisted app data must be scoped to the authenticated Firebase `uid`.

### 2.2 Restore-safe design

Deletes and updates must preserve enough information to support deterministic restore.

### 2.3 Keep current state and history separate

The app should distinguish between:

* current working state,

* append-only or effectively append-only history records.

### 2.4 Single-user simplicity

Do not model teams, members, assignees, invitations, or role systems.

### 2.5 MCP readiness

The data model should support clean service methods such as:

* create project

* update project

* delete project

* create task

* update task

* delete task

* get history

* restore revision

without requiring a redesign later.

* * *

3. Recommended collection structure

-----------------------------------

Use a user-rooted hierarchy.
    users/{uid}
      profile/main
      projects/{projectId}
        tasks/{taskId}
      history/{historyId}

This keeps all application data clearly grouped under the authenticated user.

* * *

4. Collections and documents

----------------------------

4.1 User root
-------------

### Path

`users/{uid}`

### Purpose

Top-level owner scope for all personal data.

### Recommended fields

    {
      uid: string;
      displayName: string | null;
      email: string | null;
      photoURL: string | null;
      createdAt: Timestamp;
      updatedAt: Timestamp;
      lastLoginAt: Timestamp;
    }

### Notes

* This document is optional for the first auth phase, but recommended.

* It can be created lazily on first successful login.

* Keep it simple; do not overbuild profile features.

* * *

4.2 Project collection
----------------------

### Path

`users/{uid}/projects/{projectId}`

### Purpose

Stores the current state of each project.

### Recommended fields

    {
      id: string;
      ownerUid: string;
      name: string;
      description: string | null;
      deleted: boolean;
      version: number;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }

### Field rules

* `id`: must match the Firestore document id.

* `ownerUid`: must equal the parent `uid` path value.

* `name`: required, user-visible project name.

* `description`: optional.

* `deleted`: logical delete flag.

* `version`: increment on every state-changing operation.

* `createdAt`: set once.

* `updatedAt`: update on every state-changing operation.

### Notes

* Prefer logical delete to preserve restore capability.

* Do not store member lists, assignees, or collaboration metadata.

* * *

4.3 Task subcollection
----------------------

### Path

`users/{uid}/projects/{projectId}/tasks/{taskId}`

### Purpose

Stores the current state of tasks for a given project.

### Recommended fields

    {
      id: string;
      ownerUid: string;
      projectId: string;
      title: string;
      description: string | null;
      status: 'todo' | 'doing' | 'done';
      dueDate: Timestamp | null;
      deleted: boolean;
      version: number;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }

### Field rules

* `id`: must match the Firestore document id.

* `ownerUid`: must equal the user root `uid`.

* `projectId`: must equal the parent project document id.

* `title`: required.

* `description`: optional.

* `status`: keep a small controlled enum.

* `dueDate`: optional.

* `deleted`: logical delete flag.

* `version`: increment on every state-changing operation.

* `createdAt`: set once.

* `updatedAt`: update on every state-changing operation.

### Hard constraint

No assignee-related field may exist.  
Forbidden examples:

* `assignee`

* `assigneeId`

* `assignedTo`

* `ownerUserId` as a task-level collaborator concept

* `members`

The only owner concept allowed is the signed-in user who owns the whole dataset.

* * *

4.4 History collection
----------------------

### Path

`users/{uid}/history/{historyId}`

### Purpose

Stores history entries for create/update/delete/restore actions across projects and tasks.

### Recommended fields

    {
      id: string;
      ownerUid: string;
      entityType: 'project' | 'task';
      entityId: string;
      projectId: string | null;
      action: 'create' | 'update' | 'delete' | 'restore';
      before: Record<string, unknown> | null;
      after: Record<string, unknown> | null;
      revision: number;
      changedAt: Timestamp;
      changedBy: string;
    }

### Field rules

* `id`: history record id.

* `ownerUid`: must equal the authenticated user.

* `entityType`: identifies whether the record describes a project or task.

* `entityId`: id of the changed entity.

* `projectId`: project context; for projects this is usually the same as `entityId`, for tasks this is the parent project id.

* `action`: operation type.

* `before`: snapshot before mutation.

* `after`: snapshot after mutation.

* `revision`: monotonically increasing integer per entity, or another deterministic revision strategy.

* `changedAt`: mutation timestamp.

* `changedBy`: user id performing the operation.

### Notes

* `before` and `after` should contain enough fields to reconstruct valid current state.

* Keep snapshots focused on domain state, not UI-only derived state.

* Restore actions should also create history rows.

* * *

5. Why this structure is recommended

------------------------------------

5.1 Benefits of user-rooted hierarchy
-------------------------------------

Benefits:

* ownership is visually obvious,

* Firestore rules become simpler,

* all data for one user is cleanly grouped,

* single-user product assumptions remain explicit.

5.2 Benefits of task subcollection under project
------------------------------------------------

Benefits:

* project-local task listing is natural,

* route structure matches data structure,

* deletion/restore context is easier to reason about,

* it avoids introducing a flat task namespace too early.

Tradeoff:

* cross-project task queries become more complex.

Given current scope, this tradeoff is acceptable because the product currently centers on project-scoped task management.
5.3 Benefits of top-level history under user
--------------------------------------------

Benefits:

* history can be queried across projects and tasks,

* restore operations can be centralized,

* auditing is not buried in nested structures,

* future MCP actions can retrieve history from one place.

* * *

6. Alternative considered

-------------------------

### Alternative: flat tasks collection under user

Example:
    users/{uid}/tasks/{taskId}

Reason not chosen as the default:

* it weakens project-local grouping,

* it makes project-scoped reads less intuitive,

* it invites broader query patterns earlier than needed.

This alternative can still work, but the nested project/task structure is a better fit for current scope.

* * *

7. Entity examples

------------------

7.1 Project example
-------------------

    {
      "id": "proj_abc123",
      "ownerUid": "uid_123",
      "name": "taskapi 初期構築",
      "description": "BootstrapからAuthまでの実装管理",
      "deleted": false,
      "version": 3,
      "createdAt": "server timestamp",
      "updatedAt": "server timestamp"
    }

7.2 Task example
----------------

    {
      "id": "task_xyz789",
      "ownerUid": "uid_123",
      "projectId": "proj_abc123",
      "title": "Firebase Auth を組み込む",
      "description": "Google Sign-In と session persistence を入れる",
      "status": "doing",
      "dueDate": null,
      "deleted": false,
      "version": 2,
      "createdAt": "server timestamp",
      "updatedAt": "server timestamp"
    }

7.3 History example
-------------------

    {
      "id": "hist_001",
      "ownerUid": "uid_123",
      "entityType": "task",
      "entityId": "task_xyz789",
      "projectId": "proj_abc123",
      "action": "update",
      "before": {
        "title": "Firebase Auth を組み込む",
        "status": "todo",
        "deleted": false,
        "version": 1
      },
      "after": {
        "title": "Firebase Auth を組み込む",
        "status": "doing",
        "deleted": false,
        "version": 2
      },
      "revision": 2,
      "changedAt": "server timestamp",
      "changedBy": "uid_123"
    }

* * *

8. Write rules

--------------

8.1 General rule
----------------

A state-changing operation should update:

1. the current entity document,

2. a matching history record.

When consistency matters, this should happen through controlled server-side logic or a transactional equivalent.
8.2 Create rules
----------------

On create:

* set `deleted = false`

* set `version = 1`

* set `createdAt` and `updatedAt`

* write a history row with:
  
  * `before = null`
  
  * `after = created entity snapshot`
  
  * `action = 'create'`
  
  * `revision = 1`

8.3 Update rules
----------------

On update:

* load current document

* capture `before`

* apply validated patch

* increment `version`

* set new `updatedAt`

* write history row with:
  
  * `action = 'update'`
  
  * `before = previous snapshot`
  
  * `after = next snapshot`
  
  * `revision = next version`

8.4 Delete rules
----------------

Prefer logical delete.

On delete:

* load current document

* capture `before`

* set `deleted = true`

* increment `version`

* update `updatedAt`

* write history row with:
  
  * `action = 'delete'`
  
  * `before = previous snapshot`
  
  * `after = deleted snapshot`

### Project delete rule

When deleting a project:

* the project itself must become logically deleted,

* project tasks must remain restore-safe.

Recommended approach for the product phase:

* logically delete the project,

* logically delete all non-deleted tasks under that project,

* write corresponding history entries,

* make sure restore logic can reconstitute the project/task relationship.

This is a history-sensitive operation and should be implemented through controlled server logic.
8.5 Restore rules
-----------------

On restore:

* choose the target history entry,

* derive the intended restored state from its snapshot,

* validate parent/child relationship consistency,

* write the restored current state,

* increment `version`,

* append a new history row with `action = 'restore'`.

Restore must never silently produce orphan tasks or mismatched project references.

* * *

9. Read patterns

----------------

9.1 Home/project list
---------------------

Read:

* `users/{uid}/projects`  
  Filter:

* `deleted == false`  
  Sort suggestion:

* `updatedAt desc`

9.2 Project detail
------------------

Read:

* project document

* `users/{uid}/projects/{projectId}/tasks`  
  Filter:

* `deleted == false`  
  Sort suggestion:

* `updatedAt desc` or a future explicit sort field

9.3 History view
----------------

Read:

* `users/{uid}/history`  
  Possible filters:

* by `projectId`

* by `entityType`

* by `entityId`  
  Sort suggestion:

* `changedAt desc`

* * *

10. Suggested indexes

---------------------

Exact indexes depend on query shape, but likely useful combinations include:

### Projects

* `deleted ASC, updatedAt DESC`

### Tasks (under project subcollection)

* `deleted ASC, updatedAt DESC`

* `deleted ASC, status ASC, updatedAt DESC` (only if status filtering is later added)

### History

* `projectId ASC, changedAt DESC`

* `entityType ASC, entityId ASC, changedAt DESC`

Do not add speculative indexes until query patterns require them.

* * *

11. Security rules direction

----------------------------

This is a design direction, not final Firestore Rules syntax.

### 11.1 Owner-only access

Rules must ensure:

* only authenticated users can read/write,

* a user can only access data under their own `uid` path.

### 11.2 Server-controlled writes for complex operations

For history-sensitive operations such as:

* restore,

* project delete with cascading task logical delete,

* multi-document consistency updates,

prefer controlled server-side execution rather than trusting direct client writes.

### 11.3 Validation direction

Rules and/or server validation should enforce:

* `ownerUid` consistency,

* project/task parent consistency,

* absence of forbidden collaboration fields,

* controlled enum values for task `status`.

* * *

12. TypeScript model direction

------------------------------

Recommended domain shapes:
    export type TaskStatus = 'todo' | 'doing' | 'done';

    export interface Project {
      id: string;
      ownerUid: string;
      name: string;
      description: string | null;
      deleted: boolean;
      version: number;
      createdAt: Date;
      updatedAt: Date;
    }

    export interface Task {
      id: string;
      ownerUid: string;
      projectId: string;
      title: string;
      description: string | null;
      status: TaskStatus;
      dueDate: Date | null;
      deleted: boolean;
      version: number;
      createdAt: Date;
      updatedAt: Date;
    }

    export type HistoryAction = 'create' | 'update' | 'delete' | 'restore';
    export type HistoryEntityType = 'project' | 'task';

    export interface HistoryEntry {
      id: string;
      ownerUid: string;
      entityType: HistoryEntityType;
      entityId: string;
      projectId: string | null;
      action: HistoryAction;
      before: Record<string, unknown> | null;
      after: Record<string, unknown> | null;
      revision: number;
      changedAt: Date;
      changedBy: string;
    }

Keep these types free of UI-only flags and forbidden future-scope fields.

* * *

13. Repository and service boundaries

-------------------------------------

Recommended conceptual boundaries:

### Client-side read repositories

* `ProjectReadRepository`

* `TaskReadRepository`

* `HistoryReadRepository`

### Server-side write services

* `CreateProjectService`

* `UpdateProjectService`

* `DeleteProjectService`

* `CreateTaskService`

* `UpdateTaskService`

* `DeleteTaskService`

* `RestoreRevisionService`

This separation keeps read convenience and write consistency concerns from collapsing into one layer.

* * *

14. MCP implications

--------------------

The current model cleanly supports future tool shapes such as:

* `create_project(name, description?)`

* `update_project(projectId, patch)`

* `delete_project(projectId)`

* `list_projects()`

* `create_task(projectId, title, description?, status?, dueDate?)`

* `update_task(taskId, patch)`

* `delete_task(taskId)`

* `list_tasks(projectId)`

* `get_history(projectId?, entityId?)`

* `restore_revision(historyId)`

Because ownership is scoped under `uid`, the server-side tool layer can resolve the authenticated user and operate against a consistent data model.

* * *

15. Migration and evolution notes

---------------------------------

This model is intentionally simple for the current product.  
Later additions may include:

* explicit sort order fields,

* archive behavior distinct from delete,

* label metadata,

* home dashboard summaries,

* background aggregation documents.

These should be added only when real product needs justify them.

Do not preemptively add collaboration, assignment, or enterprise-style permission structures.

* * *

16. Final recommendation

------------------------

Adopt the following as the baseline Firestore model for **taskapi**:
    users/{uid}
      projects/{projectId}
        tasks/{taskId}
      history/{historyId}

with:

* logical delete,

* versioned current-state documents,

* history snapshots for create/update/delete/restore,

* owner-only access,

* no assignee fields,

* server-controlled writes for history-sensitive operations.

This gives the product a clean foundation that is simple now and compatible with future MCP-driven actions later.
