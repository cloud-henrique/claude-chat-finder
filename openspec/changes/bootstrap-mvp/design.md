## Context

Greenfield project. See proposal.md - Why. The author knows JS/TS/PHP and is open to Python. Decisions below were made collaboratively before this document was written:

- Interface: TUI (interactive terminal UI), not a GUI or plain scriptable CLI.
- Runtime/stack: Node.js/TypeScript on Bun.
- Search: SQLite FTS5 index, not on-the-fly scanning ("binary search" was ruled out - it needs sorted data and doesn't apply to full-text search over unordered chat content).
- Distribution: single-file binaries via GitHub Releases, built with `bun build --compile`.
- Parser scope: adapter architecture from day one, with only the Claude Code adapter implemented in the MVP.

## Goals / Non-Goals

**Goals:**
- Ship a TUI that indexes and searches local Claude Code chat history with no setup beyond downloading a binary.
- Keep the parser layer pluggable so a future adapter (Cursor, Aider, Codex CLI, etc.) is a new module, not a rewrite of indexing/search/TUI.
- Keep everything local and offline: no telemetry, no network calls, since indexed content can include sensitive project code and secrets.

**Non-Goals:**
- Implementing any non-Claude-Code adapter in this change (the interface is built now; other adapters are future changes).
- A GUI or a scriptable/non-interactive CLI mode (may be revisited later; out of scope here).
- Multi-machine sync of the index or of chat history.

## Decisions

### Language/runtime: TypeScript on Bun
The author's strongest skills are JS/TS. Bun provides `bun:sqlite` (no native module build step) and `bun build --compile`, which produces a single-file, dependency-free executable per target OS/arch - directly satisfying the runtime-free distribution requirement. Alternatives considered: Go + Bubble Tea (best-in-class TUI ecosystem and static binaries, but the author would be learning the language from scratch) and Python + Textual (excellent TUI framework, but standalone packaging for 3 OSes is heavier, via PyInstaller/Nuitka). Bun was chosen to match existing skill and to get single-binary output "for free."

### TUI framework: Ink
Ink renders a terminal UI with React-style components, which maps directly onto the author's existing React/JSX familiarity from the JS/TS ecosystem. It runs fine under a Bun-compiled binary.

### Search index: SQLite FTS5 via `bun:sqlite`
`bun:sqlite` ships built into the Bun runtime (and into `bun build --compile` output), so no external SQLite dependency needs to be bundled. FTS5 gives ranked full-text search, and case-sensitive/whole-word/regex modes are layered on top: FTS5 handles the coarse full-text match, then a post-filter pass applies whole-word and regex refinement on the candidate rows. Alternatives considered: on-the-fly grep-style scanning (simpler, no index file, but scales linearly with total chat history on every search) and a plain JSON cache (avoids embedding a DB engine, but reimplements indexing/ranking that FTS5 already provides).

### Parser-adapter interface
A single TypeScript interface (e.g. `ChatAdapter`) exposes one method: given a root directory, return normalized sessions (project path, session id, timestamps, ordered messages). Indexing, search, and the TUI depend only on the normalized model, never on adapter-specific file formats. The Claude Code adapter reads `~/.claude/projects/**/*.jsonl`, resolving each session's real project path from the `cwd` field recorded in the JSONL events themselves (not from decoding the sanitized folder name, which is lossy: it replaces `/` with `-`, so a real path containing a literal `-` cannot be reconstructed from the folder name alone).

### Index location and invalidation
The SQLite file lives under the OS-appropriate config/cache directory (e.g. `~/.local/share/claude-chat-finder` / `~/Library/Application Support/claude-chat-finder` / `%LOCALAPPDATA%\claude-chat-finder`). Each indexed session row stores its source file's path and mtime; a re-index pass only re-parses files whose mtime changed and prunes rows whose source file no longer exists.

### Distribution: GitHub Releases via `bun build --compile`
A GitHub Actions matrix build (macOS, Linux, Windows) runs `bun build --compile` per target and attaches the resulting binaries to a tagged GitHub Release. No npm publish is required for the MVP end-user install path; `bun install` is only needed for contributors working on the source.

## Risks / Trade-offs

- [Ink/TUI rendering quirks across terminal emulators, especially Windows Terminal vs. legacy `cmd.exe`] → Test on all three OSes before release; document any terminal requirements in the README.
- [FTS5 ranking may not match user expectations for very short queries] → Start with FTS5's built-in ranking (`bm25`); revisit only if real usage shows it's wrong.
- [Regex mode could accept a catastrophic-backtracking pattern and hang the search] → Run regex matching with a bounded input size per message and treat it as a future hardening item if it proves to be a real problem.
- [Bun is a younger runtime than Node.js; `bun build --compile` cross-compilation edge cases are less battle-tested] → CI builds and smoke-tests all three target binaries on every release, not just the host OS.

## Open Questions

- ~~Exact config-directory conventions per OS...~~ **Resolved during chat-indexing implementation**: `src/indexing/paths.ts` hand-rolls `resolveIndexDbPath(home, platform, env)` (XDG Base Directory on Linux incl. `XDG_DATA_HOME`, `Application Support` on macOS, `%LOCALAPPDATA%` on Windows) instead of using a library like `env-paths`. Reason: an established library's path-joining always resolves through the live host's `node:path` (there's no way to inject "join with Windows semantics" while running tests on macOS/Linux), so its output isn't assertable with exact-string unit tests for all three OSes from one CI host — which the task's own verification criterion requires. The hand-rolled version takes `home`/`platform`/`env` as parameters (same pattern as `src/adapters/claude-code/paths.ts` from parser-adapters), so each OS's convention is precisely testable from any host. The conventions themselves are still the standard, well-documented ones (same as `env-paths` implements) — only the ~20-line join logic is inline instead of imported.
- ~~How to render Markdown in the terminal, and whether to add a dependency for it.~~ **Resolved during tui implementation**: hand-rolled in `src/tui/markdown.ts`. A library (`marked-terminal`, `ink-markdown`) returns a formatted *string*, but the preview pane has to scroll, which means slicing the output by display line — so the renderer emits styled spans per already-wrapped line instead. That also makes each rule (headings, fences, lists, quotes, wrapping) assertable in unit tests. Same trade-off as `src/indexing/paths.ts`: the needed subset is small and precisely testable, so inlining it beats importing a general-purpose renderer.
- ~~Whether indexing runs before the TUI mounts or after the first paint.~~ **Resolved during tui implementation**: after. A full build takes ~1.5s on a real history (~330 sessions), which is too long to show nothing; the app paints immediately, reports "indexing…" in the header, and runs the first search once the index is ready.
- Whether to generalize the project's name (repo, `ccf` binary, docs) away from "claude" once a second, non-Claude-Code adapter (e.g. Codex CLI, OpenCode) actually ships, to read as clearly welcoming to those tools' users while staying identifiable. Deferred, not resolved now: [claude-code-history-viewer](https://github.com/jhlee0409/claude-code-history-viewer) kept its Claude-branded name even after adding support for 29 providers, so multi-provider support does not force a rename by itself — this is a branding call to revisit once a second adapter is real, not a consequence of the `parser-adapters` architecture.
