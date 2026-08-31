## Why

Claude Code stores every conversation as JSONL files under `~/.claude/projects/`, but there is no way to find a specific past chat besides manually grepping raw JSON across every project folder. Developers who use Claude Code daily (via terminal, VS Code extension, or other integrations that share the same local storage) accumulate hundreds of sessions and have no fast, private way to search, preview, or retrieve one. This change delivers an open-source, cross-platform tool that lets any Claude Code user index and search their own local chat history in seconds.

## What Changes

- New open-source CLI tool (`claude-chat-finder`) distributed as a single-file executable for macOS, Linux, and Windows.
- A pluggable parser-adapter interface for chat-history sources, with a Claude Code adapter (`~/.claude/projects/**/*.jsonl`) as the only adapter shipped in the MVP.
- A local SQLite FTS5 index built from parsed sessions, kept up to date incrementally (no full re-scan on every run).
- A full-text search engine supporting case-sensitive/insensitive matching, whole-word matching, and regex, scoped by project/session metadata.
- An interactive terminal UI (TUI) for browsing matches, live search-as-you-type, and a Markdown-rendered preview pane.
- Copy-to-clipboard actions for the selected chat as Markdown or as raw JSON.
- "Open containing file" action that opens the session's underlying file in Finder/Explorer/the OS file manager.
- Everything runs fully offline with no network calls and no telemetry, since chat history can contain sensitive project content.

## Capabilities

### New Capabilities
- `parser-adapters`: Pluggable interface for parsing chat-history sources into a normalized session/message model, with a Claude Code JSONL adapter as the first (and only, for MVP) implementation.
- `chat-indexing`: Builds and incrementally maintains a local SQLite FTS5 index from parsed sessions, keyed by file path and modification time.
- `search`: Full-text query engine over the index supporting case sensitivity, whole-word, and regex match modes, with ranked results.
- `tui`: Interactive terminal interface for navigating projects/sessions, live search, and a Markdown preview pane.
- `export`: Copy the selected chat as Markdown or JSON to the clipboard, and open the underlying session file in the OS file manager.
- `cross-platform-distribution`: Single-file executables for macOS, Linux, and Windows built with Bun and published via GitHub Releases, requiring no separately installed runtime.

### Modified Capabilities
- None (greenfield project; no existing specs).

## Impact

- New repository, new codebase (TypeScript on Bun). No existing systems affected.
- Introduces a local SQLite database file (index cache) under the user's config directory.
- Introduces a build/release pipeline (GitHub Actions) that cross-compiles binaries for 3 operating systems.
- No network calls, no telemetry, no external services — the tool only reads local `~/.claude/projects/` (or the OS-equivalent path) files.
