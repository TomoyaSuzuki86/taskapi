# Client Service Boundaries

Bootstrap keeps service definitions as interfaces only.

- Read services can later subscribe to Firestore-backed data.
- Write services should be routed through controlled server logic once history integrity matters.
- No assignee or collaboration concepts belong in these contracts.
