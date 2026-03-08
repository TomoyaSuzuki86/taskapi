# Server Layer

This directory now contains the server-controlled write path for history-safe project and task mutations.

- `api/` exposes callable Firebase Functions and Admin SDK initialization
- `domain/` owns payload validation, mutation results, and write orchestration
- `persistence/` owns Firestore path helpers for Admin SDK writes
- `mcp/` remains reserved for a later phase
