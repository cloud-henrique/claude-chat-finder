# claude-chat-finder

Find any past conversation you've had with [Claude Code](https://claude.com/claude-code) — in seconds, right from your terminal.

> 🚧 **Status: planning / early implementation.** The full plan (proposal, specs, and tasks) is already defined in [`openspec/changes/bootstrap-mvp`](openspec/changes/bootstrap-mvp/proposal.md). This README describes the MVP's target behavior and will be updated as the code progresses.

## The problem

Claude Code stores every conversation as JSONL files under `~/.claude/projects/`, but there's no way to find a specific past chat besides manually running `grep` across every project folder. Anyone who uses Claude Code daily (terminal, VS Code extension, or any other integration that shares the same local storage) accumulates hundreds of sessions with no fast way to search, preview, or retrieve an old conversation.

`claude-chat-finder` (`ccf`) fixes that: a single, dependency-free binary that indexes your local history and gives you a fast TUI to search it.

## Features

- 🔍 **Instant full-text search** across your entire history, via a local index (SQLite FTS5)
- 🎛️ **Search modes**: case sensitive/insensitive, whole word, regex
- 🖥️ **Interactive TUI**: keyboard navigation, search-as-you-type, Markdown preview
- 📋 **Copy a chat** as Markdown or as JSON
- 📂 **Open in Finder/Explorer**: jump straight to the session's `.jsonl` file
- 🧩 **Adapter-based architecture**: only reads the Claude Code format today, but the interface is already designed for other AI CLI tools down the road
- 🔒 **100% local and offline**: no network calls, no telemetry — your chat history can contain sensitive code and secrets
- 💻 **Cross-platform**: macOS, Linux, and Windows, no Node/Bun installation required

Behavioral details (with testable scenarios) live in each capability's spec under [`openspec/changes/bootstrap-mvp/specs/`](openspec/changes/bootstrap-mvp/specs/).

## Installation

### Pre-built binary (recommended, once the first release ships)

```bash
curl -fsSL https://raw.githubusercontent.com/cloud-henrique/claude-chat-finder/main/install.sh | sh
```

macOS, Linux, and Windows binaries will be published on [GitHub Releases](../../releases) — no runtime needs to be installed.

### From source (to contribute)

Requires [Bun](https://bun.sh) — the version CI runs is pinned in [`.bun-version`](.bun-version), which `asdf`/`mise` also read.

```bash
git clone https://github.com/cloud-henrique/claude-chat-finder.git
cd claude-chat-finder
bun install
bun run dev
```

Before opening a PR, run what CI runs:

```bash
bun run typecheck
bun run lint
bun test
```

[CI](.github/workflows/ci.yml) type-checks and lints once on Linux, then runs the test suite on Linux, macOS, and Windows — the three targets binaries are published for.

To build a local binary:

```bash
bun run build
```

## Usage

```bash
ccf
```

This opens the TUI, indexing (or incrementally re-indexing) your Claude Code history as needed.

| Action | Shortcut |
|---|---|
| Search | type (live search, no need to press Enter) |
| Navigate results | `↑` / `↓` |
| Preview the selected chat | automatic on selection |
| Scroll the preview | `PgUp` / `PgDn` |
| Cycle match mode (text → whole word → regex) | `Tab` |
| Toggle case sensitivity | `Ctrl+T` |
| Move the caret in the query | `←` / `→` / `Home` / `End` |
| Delete the word before the caret | `Ctrl+W` |
| Clear the query | `Ctrl+U`, or `Esc` |
| Copy the selected chat as Markdown | `Ctrl+Y` |
| Copy the selected chat as JSON | `Ctrl+R` |
| Reveal the chat's file in Finder/Explorer/your file manager | `Ctrl+O` |
| Quit | `Esc` on an empty query, or `Ctrl+C` |

Every printable key goes into the query (that's what makes search-as-you-type work), so commands are bound to modifier combinations rather than bare letters. The footer shows as many of these hints as the terminal is wide enough for, dropping the least important ones first.

On Linux, copying uses `wl-copy` on Wayland and `xclip` otherwise, and revealing a file uses `xdg-open` — install `wl-clipboard`, `xclip` and `xdg-utils` as your session needs. macOS and Windows need nothing extra. If a helper is missing, `ccf` says which package provides it.

## How it works

Quick overview: adapters read chat files from a source (today, only Claude Code) → an indexer normalizes and writes everything to a local SQLite FTS5 database → search queries that index → the TUI displays and lets you export the results.

Architecture details, technical decisions, and trade-offs live in [`ARCHITECTURE.md`](ARCHITECTURE.md) and in [`openspec/changes/bootstrap-mvp/design.md`](openspec/changes/bootstrap-mvp/design.md).

## Configuration

The local index lives in your OS's standard config/cache directory (e.g. `~/Library/Application Support/claude-chat-finder` on macOS, XDG on Linux, `%LOCALAPPDATA%\claude-chat-finder` on Windows). No manual configuration is needed for basic use.

## Privacy

This project makes no network calls and collects no telemetry. All processing — reading files, indexing, and search — happens locally on your machine, because your chat history can contain sensitive information from your code and projects.

## Contributing

Open-source project (MIT) — forks, issues, and PRs are welcome.

This repository uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) for spec-driven planning. For a larger change (new capability, behavior change), open a proposal before writing code:

```bash
openspec init          # if you don't have the CLI set up locally yet
/opsx:propose "your idea here"
```

Current specs live in `openspec/specs/`, in-progress changes in `openspec/changes/`. For small fixes (typos, simple bugs), a direct PR is enough.

## License

MIT — see [`LICENSE`](LICENSE).
