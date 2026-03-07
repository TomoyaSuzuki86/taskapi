# ExecPlan: Authentication and Session Persistence for taskapi

## 1. Plan metadata

* Plan name: `auth-session`
* Target product: **taskapi（タスカピ）**
* Plan type: feature phase / core platform behavior
* Status: draft

---

## 2. Objective

Implement authentication and session persistence for **taskapi** using Firebase Authentication with Google Sign-In.

This phase must make the app behave like a real signed-in product shell:

* the user can sign in with Google,
* login state persists across app reopen,
* the authenticated user lands in the home experience,
* explicit logout is supported,
* auth resolution shows a stable loading/skeleton UI instead of a blank screen.

This phase is foundational because nearly every later feature depends on a reliable authenticated user context.

---

## 3. Why this phase exists

Without a clear auth/session phase, later work tends to scatter auth checks across screens, create route confusion, and produce flicker or blank-screen startup behavior.

This plan creates a stable authentication baseline for:

* owner-scoped Firestore access,
* device-to-device continuity for the same Google account,
* future project/task/history ownership,
* future server-side write control,
* future MCP integration tied to a known user identity.

---

## 4. Scope

### 4.1 In scope

This plan includes:

* Firebase Authentication integration
* Google Sign-In implementation
* auth bootstrap state handling
* persistent session behavior
* authenticated vs unauthenticated route entry behavior
* logout flow
* user session context/provider
* loading/skeleton state during auth resolution
* basic home entry after authentication
* basic unauthenticated entry screen
* error handling for auth startup and sign-in failure
* documentation updates for Firebase Auth setup

### 4.2 Explicitly out of scope

This plan does **not** include:

* project CRUD
* task CRUD
* history persistence
* restore behavior
* server-side write APIs
* Firestore data reads beyond minimal profile/bootstrap use if needed
* MCP implementation
* full settings screen

Minimal placeholders are allowed where needed to complete the auth flow.

---

## 5. Inputs and governing docs

Implementation must follow:

* `AGENTS.md`
* `docs/requirements/taskapi.md`
* `docs/plans/bootstrap-execplan.md`

If there is a conflict, priority order is:

1. explicit user instructions,
2. hard requirements in `AGENTS.md`,
3. `docs/requirements/taskapi.md`,
4. this ExecPlan.

---

## 6. Success criteria

This phase is complete only when all of the following are true:

1. The app supports Google Sign-In through Firebase Authentication.
2. A successful sign-in leads to the authenticated home experience.
3. Reopening the app while the session is valid returns the user to the authenticated experience.
4. The user is not repeatedly prompted to log in unless they explicitly log out or the session is invalid.
5. The app shows a stable loading/skeleton experience during auth resolution.
6. Protected routes/screens do not flash incorrect unauthenticated UI during startup.
7. Logout works correctly and returns the app to the unauthenticated experience.
8. The authenticated user context is available in a clean, reusable structure for later phases.
9. Setup and environment documentation is updated.

---

## 7. Deliverables

### 7.1 Code deliverables

* Firebase Auth integration
* Google Sign-In flow
* auth provider / session context
* auth bootstrap gate or equivalent
* authenticated route handling
* unauthenticated entry screen
* logout action
* auth loading skeleton shell
* error handling path for sign-in failure

### 7.2 Documentation deliverables

* README update for Firebase Auth setup
* required Firebase console configuration notes
* environment variable expectations if changed
* short note describing the next recommended phase

---

## 8. UX and behavior requirements

## 8.1 Required startup behavior

When the app starts:

1. It resolves auth state.
2. While auth is unresolved, it shows a loading shell or skeleton.
3. If the user is authenticated, it enters the authenticated app shell.
4. If not authenticated, it shows the login screen.

A blank screen or obvious route flicker is not acceptable.

## 8.2 Required sign-in behavior

When the user taps the Google sign-in action:

* the app initiates Firebase Google sign-in,
* success leads into the authenticated home screen,
* failure is shown clearly without crashing the app.

## 8.3 Required session persistence behavior

If the user closes and reopens the app while the session remains valid:

* the app should reopen into the authenticated experience,
* the user should not have to sign in again.

## 8.4 Required logout behavior

When the user explicitly logs out:

* the Firebase session is cleared,
* app-owned session state resets,
* the app returns to the unauthenticated entry screen.

---

## 9. Work breakdown

## Workstream A: Firebase Auth setup

### Goal

Enable Firebase Authentication as the auth provider for the app.

### Tasks

1. Add Firebase Auth dependency usage to the existing Firebase client setup.

2. Create an auth module responsible for auth initialization and API access.

3. Configure GoogleAuthProvider.

4. Define clear exported functions for:
   
   * sign in with Google
   * sign out
   * subscribe to auth state

5. Keep the module small and reusable.

### Done when

* Firebase Auth is correctly initialized from a single clear module
* Google provider setup is not duplicated elsewhere

---

## Workstream B: Auth state model

### Goal

Represent auth state cleanly in the client.

### Tasks

1. Define auth state types, e.g.:
   
   * loading
   * authenticated
   * unauthenticated
   * error (if modeled explicitly)

2. Create a provider, store, or hook for consuming auth state.

3. Ensure the auth state includes enough user identity for later ownership-based logic.

### Done when

* screens can reliably know whether auth is loading, present, or absent
* auth state does not require ad hoc Firebase calls inside arbitrary components

---

## Workstream C: Auth bootstrap gate

### Goal

Control app startup so the UI is stable during auth resolution.

### Tasks

1. Implement a top-level auth gate or bootstrap wrapper.
2. Show a skeleton shell while Firebase resolves current auth state.
3. Render authenticated routes only after auth is known.
4. Render login entry when auth is absent.

### Done when

* startup avoids blank screens
* startup avoids visible flicker between login and app shell
* the skeleton aligns with the real layout direction

---

## Workstream D: Google sign-in UI

### Goal

Provide a simple, reliable sign-in entry experience.

### Tasks

1. Build the login screen or route.
2. Add a clear Google sign-in CTA.
3. Add in-progress protection to avoid duplicate sign-in attempts.
4. Handle sign-in errors gracefully.

### Done when

* the sign-in screen is usable on mobile and desktop
* the action is understandable and stable

---

## Workstream E: Authenticated home entry

### Goal

Ensure the authenticated user lands in the product shell.

### Tasks

1. Define the authenticated landing route.
2. Route authenticated users to home.
3. Prevent authenticated users from unnecessarily staying on the login screen.
4. Keep placeholder home content acceptable until project features are implemented.

### Done when

* successful sign-in lands on home
* authenticated revisit also lands on home

---

## Workstream F: Logout flow

### Goal

Support explicit session termination.

### Tasks

1. Add a logout UI entry point.
2. Call Firebase sign-out.
3. Clear derived auth state.
4. Return the user to unauthenticated entry.

### Done when

* logout is explicit and reliable
* the app cannot remain in a stale authenticated state after logout

---

## Workstream G: Route protection strategy

### Goal

Prevent incorrect access and route confusion.

### Tasks

1. Decide and implement a simple route guarding strategy.
2. Protect authenticated areas.
3. Redirect unauthenticated users away from protected screens.
4. Redirect authenticated users away from login when appropriate.

### Done when

* route behavior is predictable
* protected views are not exposed to unauthenticated state

---

## Workstream H: Developer setup and docs

### Goal

Make Firebase Auth setup reproducible.

### Tasks

1. Update README with Firebase Auth setup steps.
2. Document Google provider enablement in Firebase console.
3. Document allowed domains / local development notes if applicable.
4. Document local environment setup.

### Done when

* a new implementer can configure and run auth without guesswork

---

## 10. Recommended implementation sequence

Use this order unless the repository structure requires a slight adjustment.

1. extend Firebase module for Auth
2. define auth state model and hooks/provider
3. build auth bootstrap gate and skeleton shell
4. implement login screen and Google sign-in
5. wire authenticated home routing
6. implement logout
7. finalize redirects/route protection
8. update docs
9. run review/debug cycle
10. apply required fixes only

---

## 11. Implementation notes

### 11.1 Sign-in mode

For a web SPA, prefer the Firebase approach appropriate to the app UX and platform constraints.
Popup is often simplest on desktop, but redirect compatibility should be considered for mobile/PWA scenarios.
Choose the method that best supports reliable behavior in the actual target environment.

### 11.2 Session persistence

Use Firebase Auth persistence behavior intentionally rather than relying on accidental defaults.
The implementation should make the “stay signed in until explicit logout” behavior clear.

### 11.3 User profile persistence

Do not overbuild a profile system in this phase.
Only capture/store extra user profile data if genuinely needed to support the product shell.

### 11.4 UI simplicity

The login experience should be calm and minimal.
Avoid adding speculative marketing, onboarding, or multi-account complexity.

---

## 12. Risks and mitigations

### Risk 1: Auth flicker on startup

Problem:
The app briefly shows login before switching to authenticated UI.

Mitigation:
Use an explicit auth bootstrap loading state and render gating.

### Risk 2: Session does not persist as intended

Problem:
The user gets unexpectedly logged out or re-prompted.

Mitigation:
Test reopen behavior and configure auth persistence intentionally.

### Risk 3: Mobile sign-in quirks

Problem:
Popup-based sign-in may behave inconsistently in some mobile/PWA contexts.

Mitigation:
Validate the chosen sign-in method in the actual target environments and switch to redirect flow if needed.

### Risk 4: Route loops or confusing redirects

Problem:
Protected/public route logic becomes circular.

Mitigation:
Keep routing simple and centralize auth-gate decisions.

---

## 13. Testing strategy

## 13.1 Automated

Where practical, add coverage for:

* auth state mapping logic
* route gating behavior
* login screen render
* logout action side effects (mocked)

## 13.2 Manual validation

Validate at minimum:

1. first visit when signed out,
2. sign-in success path,
3. app reopen while signed in,
4. logout path,
5. direct navigation to protected route while signed out,
6. revisit login route while signed in,
7. mobile-width layout,
8. startup loading/skeleton experience.

---

## 14. Review plan (mandatory)

This phase must follow the role flow in `AGENTS.md`.

### 14.1 Implementer summary must cover

* chosen sign-in method and why
* auth state model
* route guard approach
* deferred items

### 14.2 Code Quality Reviewer must check

* auth logic centralization
* lack of duplicated Firebase calls
* clean route protection design
* maintainable state handling
* clear error/loading handling

### 14.3 Requirement Reviewer must check

* single-user assumption preserved
* no assignee concept introduced
* login persistence requirement satisfied
* authenticated reopen behavior satisfied
* SPA behavior preserved
* skeleton requirement satisfied for auth bootstrap
* Firebase Authentication is used as required

### 14.4 Debugger must validate

* actual sign-in flow
* startup auth resolution behavior
* logout
* protected/public route transitions
* mobile viewport behavior

### 14.5 Triage Judge must classify

all findings into:

* required before merge
* can defer
* reject recommendation

### 14.6 Fix Planner must produce

an ordered patch plan for accepted findings before rework begins.

---

## 15. Merge checklist

An auth/session MR is mergeable only if all boxes below are effectively true:

* [ ] Google Sign-In works
* [ ] Auth state is centrally modeled
* [ ] Startup auth resolution shows loading/skeleton UI
* [ ] Authenticated users land on home
* [ ] Unauthenticated users see login
* [ ] Session persists across reopen until explicit logout
* [ ] Logout works
* [ ] Route behavior is predictable
* [ ] Docs are updated
* [ ] Review roles completed
* [ ] Required findings resolved

---

## 16. Handoff to next phase

When this ExecPlan is complete, the next recommended phase is:

* Firestore data model and data access foundation

That next phase should define:

* collection/document structure
* ownership conventions
* history document shape
* restore-safe delete rules
* type definitions and repository boundaries

---

## 17. Final rule

This phase succeeds when authentication becomes boring and reliable.
If the implementation makes sign-in, reopen, and logout behavior unsurprising and stable, it is on the right track.
