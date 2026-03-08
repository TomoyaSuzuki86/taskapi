# Server Layer

`functions/src` is the active runtime source of truth for taskapi callable behavior.

This `server/` tree remains only as local compatibility/reference code for root-level review and test coverage while the repository transitions toward the `functions/` package layout.

- `api/` contains legacy callable-oriented references
- `domain/` contains legacy write-path references
- `persistence/` contains shared path helpers mirrored for local coverage
- `mcp/` remains reserved for a later phase
