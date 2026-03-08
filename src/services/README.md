# Client Service Boundaries

This layer now owns Firestore-backed read repositories and callable write clients.

- page components consume hooks or data-service modules, not Firestore directly
- reads remain owner-scoped under `users/{uid}/...`
- project/task mutations flow through callable Firebase Functions
- repositories preserve the existing UI contract while hiding write transport details
- no assignee or collaboration concepts belong in these contracts
