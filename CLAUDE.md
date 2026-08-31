# CLAUDE.md

Project context for Claude Code working in this repository.

## What this project is

`claude-chat-finder` (binary: `ccf`) is an open-source TUI for searching, indexing, and browsing the local Claude Code chat history (`~/.claude/projects/**/*.jsonl`). See [`README.md`](README.md) for the product vision and [`ARCHITECTURE.md`](ARCHITECTURE.md) for the technical design.

The project is being built with [OpenSpec](https://github.com/Fission-AI/OpenSpec) (spec-driven development). The first change, with the full proposal/specs/design/tasks, is in [`openspec/changes/bootstrap-mvp/`](openspec/changes/bootstrap-mvp/).

## Stack

- **Runtime**: Bun (not plain Node — uses `bun:sqlite` and `bun build --compile`)
- **Language**: TypeScript
- **TUI**: Ink (React-style components)
- **Search index**: SQLite FTS5 via `bun:sqlite`
- **Distribution**: single-file binaries per OS via `bun build --compile`, published on GitHub Releases

## Commands (once the project is initialized)

```bash
bun install       # install dependencies
bun run dev       # run the TUI in development mode
bun test          # run tests
bun run lint      # lint/format
bun run build     # produce a local binary via bun build --compile
```

## Working with OpenSpec

This repo uses OpenSpec for non-trivial changes (a new capability, an observable behavior change). Flow:

1. `/opsx:propose "description of the idea"` — creates `openspec/changes/<name>/` with proposal, specs, design, and tasks
2. Review the artifacts before implementing
3. `/opsx:apply` — implements the active change's `tasks.md`
4. `/opsx:archive` — archives the change and syncs `openspec/specs/` as the source of truth

For small fixes (typo, isolated bug, no observable behavior change), opening a change isn't necessary — edit directly.

**Currently active change**: `bootstrap-mvp` (the full MVP — all 6 capabilities). See [`tasks.md`](openspec/changes/bootstrap-mvp/tasks.md) for the implementation checklist, in order.

## Project conventions and constraints

- **Zero network, zero telemetry.** The indexed chat history can contain the user's code and secrets. No network call should be added to any core module (adapters, indexing, search). This is a requirement, not a style preference — it's in [`cross-platform-distribution`](openspec/changes/bootstrap-mvp/specs/cross-platform-distribution/spec.md) and in design.md.
- **The project path comes from the event's `cwd`, never from the decoded folder name.** Claude Code sanitizes `/` → `-` in the folder name ambiguously (a path with a literal hyphen isn't reversible). Always read the real path from the `cwd` field inside the JSONL itself. See the detailed gotcha in [`ARCHITECTURE.md`](ARCHITECTURE.md#adapter-contract).
- **Indexing/search/TUI modules never know an adapter's raw format.** Everything goes through the normalized `Session`/`Message` model defined by the `ChatAdapter` interface. When adding a new adapter, it must implement that interface — don't leak source-format details outside `src/adapters/`.
- **Genuinely cross-platform.** macOS, Linux, and Windows are all MVP targets. Any code touching filesystem paths, the config directory, or opening the OS's file manager needs to account for all three — don't assume POSIX-only.
- **No premature abstraction.** Only one adapter (Claude Code) exists in the MVP; the interface exists so a future adapter isn't blocked, not to generalize code that doesn't have a second real use case yet.

## Tests

Every requirement in `openspec/changes/bootstrap-mvp/specs/*/spec.md` has scenarios in WHEN/THEN format meant to become test cases. When implementing a `tasks.md` item, the verification criteria is already described in that task itself.
