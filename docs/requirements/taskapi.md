taskapi Requirements
====================

1. Overview

-----------

### 1.1 Product

* Official name: **taskapi**

* Reading / nickname: **タスカピ**

### 1.2 Product summary

**taskapi** is a single-user personal task management web app designed for future MCP integration.  
It allows a user to manage projects and tasks across devices using Google login, with history retention and restore capability.

### 1.3 Product goals

The product must:

* support personal project and task management,

* work consistently across devices for the same Google account,

* be installable as a PWA,

* preserve change history,

* support restore from history,

* remain easy to connect to ChatGPT/OpenAI through MCP later.

* * *

2. Scope

--------

### 2.1 In scope

* Google login with Firebase Authentication

* persistent login session until explicit logout

* SPA web app

* PWA installability

* project CRUD

* task CRUD

* project/task history retention

* restore from history

* Firebase Hosting

* Cloud Firestore

* mobile-friendly responsive UI

* skeleton screens during initial and async loading states

* MCP-ready architecture

### 2.2 Out of scope

Unless explicitly added later, the following are out of scope:

* multi-user collaboration

* shared projects

* assignees / task ownership by member

* comments

* file attachments

* notifications

* calendar sync

* subtasks

* labels/tags

* time tracking

* role-based access control

* advanced offline conflict resolution

* * *

3. Non-negotiable requirements

------------------------------

These are hard constraints.

1. The app is for **single-user personal use only**.

2. Multi-user collaboration is out of scope.

3. Task assignee functionality must not exist in UI, data model, or API.

4. Authentication must use **Google Sign-In via Firebase Authentication**.

5. The same Google account must see the same data across devices.

6. The app must reopen to the authenticated home screen unless the user explicitly logs out.

7. The app must be a **SPA**.

8. **Skeleton screens** must be shown during initial load and major async loading states.

9. The app must be **PWA-installable**.

10. Data must use **Cloud Firestore**.

11. Hosting must use **Firebase Hosting**.

12. The system must preserve history for create, update, delete, and restore actions.

13. The system must allow restore from previous history states.

14. The architecture must remain straightforward to expose through MCP later.

* * *

4. Users and usage model

------------------------

### 4.1 User model

There is exactly one end-user per account scope.  
The user signs in with Google and uses the product for personal task management.

### 4.2 Device model

The same authenticated user may access the app from:

* desktop browser

* smartphone browser

* installed PWA on mobile or desktop

All devices must show the same persisted dataset for the same authenticated Google account.

* * *

5. Functional requirements

--------------------------

5.1 Authentication
------------------

### 5.1.1 Google sign-in

The app must allow sign-in with Google through Firebase Authentication.

### 5.1.2 Session persistence

The app must preserve login state so that, after successful sign-in, reopening the app returns the user to the authenticated experience unless the user explicitly logs out.

### 5.1.3 Logout

The app must provide an explicit logout action.  
After logout, the user must return to the unauthenticated state.

### 5.1.4 Auth bootstrap UX

During auth resolution at app startup, the UI must show a loading experience, preferably a skeleton-based shell, rather than a blank screen.

* * *

5.2 Home and navigation
-----------------------

### 5.2.1 Home screen

After authentication, the default entry screen must be the home screen.

### 5.2.2 Home content

The home screen must display:

* project list,

* project creation entry point,

* empty state when no projects exist,

* loading skeleton while project data is loading.

### 5.2.3 Navigation model

The app must behave as a SPA with client-side navigation and without unnecessary full page reloads.

* * *

5.3 Project management
----------------------

### 5.3.1 Create project

The user must be able to create a project.

Required fields:

* `name` (required)

Optional fields:

* `description`

### 5.3.2 Update project

The user must be able to edit project data.

### 5.3.3 Delete project

The user must be able to delete a project.  
Deletion must require explicit confirmation.

Delete should be implemented in a way that keeps restore possible.  
Logical delete is preferred.

### 5.3.4 Project history

Project create, update, delete, and restore actions must generate history records.

### 5.3.5 Restore project

The user must be able to restore a previous project state from history.  
Restore must itself generate a history record.

* * *

5.4 Task management
-------------------

### 5.4.1 Task list

Each project must have a task list view.

### 5.4.2 Create task

The user must be able to create a task under a project.

Required fields:

* `title`

Optional fields:

* `description`

* `status`

* `dueDate`

### 5.4.3 Update task

The user must be able to edit task data.

### 5.4.4 Delete task

The user must be able to delete a task.  
Deletion must require explicit confirmation.  
Delete should preserve restore capability.

### 5.4.5 Task history

Task create, update, delete, and restore actions must generate history records.

### 5.4.6 Restore task

The user must be able to restore a previous task state from history.  
Restore must itself generate a history record.

### 5.4.7 No assignees

The product must not support task assignees.  
No assignee field may appear in:

* UI

* client types

* server types

* Firestore documents

* API payloads

* MCP tool contracts

* * *

5.5 History and restore
-----------------------

### 5.5.1 History coverage

History must capture, at minimum:

* entity type

* entity id

* related project id where applicable

* action type

* previous value snapshot

* next value snapshot

* actor uid

* timestamp

* revision id or equivalent identifier

### 5.5.2 Restore behavior

Restore must reconstruct a valid current state from stored history.  
Restore must not silently corrupt relationships or create orphan data.

### 5.5.3 View history

The user must be able to view history entries for relevant entities or scopes.

* * *

5.6 PWA
-------

### 5.6.1 Installability

The app must be installable as a PWA on supported platforms.

### 5.6.2 PWA assets

The app must include:

* web manifest

* icons

* service worker setup

* appropriate display mode and theme configuration

### 5.6.3 PWA identity

The app must present itself as:

* name: `taskapi`

* friendly reading: `タスカピ`

* * *

5.7 MCP readiness
-----------------

The app does not need to ship MCP in the bootstrap phase, but its architecture must keep MCP integration simple.

The business logic for project/task operations should be reusable from:

* UI-driven API calls

* future MCP tools

Likely future MCP tools include:

* `create_project`

* `update_project`

* `delete_project`

* `list_projects`

* `create_task`

* `update_task`

* `delete_task`

* `list_tasks`

* `get_history`

* `restore_revision`

* * *

6. Data requirements

--------------------

6.1 High-level entities
-----------------------

* user

* project

* task

* history

6.2 Project shape
-----------------

Minimum project fields:

* `id`

* `ownerUid`

* `name`

* `description`

* `createdAt`

* `updatedAt`

* `deleted`

* `version`

6.3 Task shape
--------------

Minimum task fields:

* `id`

* `projectId`

* `ownerUid`

* `title`

* `description`

* `status`

* `dueDate`

* `createdAt`

* `updatedAt`

* `deleted`

* `version`

6.4 History shape
-----------------

Minimum history fields:

* `id`

* `ownerUid`

* `entityType`

* `entityId`

* `projectId`

* `action`

* `before`

* `after`

* `revision`

* `changedAt`

* `changedBy`

6.5 Ownership rule
------------------

All persisted data must be scoped to the authenticated Firebase `uid`.
6.6 Integrity rule
------------------

Project/task writes and history writes must remain consistent.  
If possible, updates that change current state and append history should be done transactionally or through an equivalent server-controlled consistency path.

* * *

7. UX requirements

------------------

7.1 Mobile-first
----------------

The UI must be designed mobile-first and scale cleanly to desktop.
7.2 Skeleton screens
--------------------

Skeleton screens are required for at least:

* auth bootstrap

* project list loading

* project detail loading

* task list loading

* history loading

Blank screens during meaningful loading periods are not acceptable.
7.3 Empty states
----------------

Major list screens must have intentional empty states.
7.4 Destructive action UX
-------------------------

Delete and restore actions must provide clear confirmation or equivalent safety UX.
7.5 Feedback
------------

The UI should provide clear success/failure feedback for user actions.  
Examples include toast, snackbar, inline status, or equivalent patterns.

* * *

8. Technical requirements

-------------------------

8.1 Required platform choices
-----------------------------

* Frontend: SPA web app

* Authentication: Firebase Authentication (Google)

* Database: Cloud Firestore

* Hosting: Firebase Hosting

* Server-side write/control layer: Google Cloud compatible runtime such as Cloud Run

8.2 Architecture expectations
-----------------------------

Keep clear boundaries between:

* UI rendering

* state management

* domain logic

* persistence logic

* history/restore logic

* external integration layer

8.3 Read/write policy
---------------------

Preferred model:

* reads may use direct Firestore subscription where appropriate,

* writes should flow through controlled logic when consistency matters,

* history-sensitive operations must not bypass required audit behavior.

* * *

9. Security requirements

------------------------

### 9.1 Authentication

Only authenticated users may access app data.

### 9.2 Authorization

The user must only be able to access their own records.

### 9.3 Firestore security

Firestore rules must enforce owner-only access assumptions.

### 9.4 Secret handling

Secrets must not be committed to source control.

* * *

10. Quality requirements

------------------------

### 10.1 Maintainability

The codebase must remain understandable and modular.

### 10.2 Reviewability

Changes should be small and reviewable.

### 10.3 Testability

Core logic should be testable in isolation where practical.

### 10.4 Extensibility

The implementation should avoid locking the project into patterns that make future MCP integration difficult.

* * *

11. Acceptance criteria

-----------------------

A version of taskapi is acceptable only if all of the following are true:

1. A user can sign in with Google.

2. Login state persists until explicit logout.

3. Reopening the app while authenticated returns to the home experience.

4. Projects can be created, edited, deleted, and restored.

5. Tasks can be created, edited, deleted, and restored.

6. History is retained for create, update, delete, and restore actions.

7. The app behaves as a SPA.

8. Skeleton screens appear during initial and major async loads.

9. The app is installable as a PWA.

10. The same Google account sees the same data across devices.

11. No assignee functionality exists anywhere.

12. The code structure remains suitable for future MCP exposure.

* * *

12. Initial delivery phases

---------------------------

Recommended high-level delivery sequence:

1. Bootstrap foundation

2. Authentication and session persistence

3. Data model and Firestore structure

4. Project management

5. Task management

6. History and restore

7. Server-controlled write path

8. PWA completion

9. MCP integration

This order is recommended because the app must become a correct product before MCP is added.
