# Client Service Boundaries

This layer now owns Firestore-backed project and task repositories.

- page components consume hooks or data-service modules, not Firestore directly
- repositories keep all document paths under `users/{uid}/...`
- complex history-sensitive writes are still deferred to a later server-controlled phase
- no assignee or collaboration concepts belong in these contracts
