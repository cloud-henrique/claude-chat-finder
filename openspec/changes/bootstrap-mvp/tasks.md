## 1. Project Setup

- [x] 1.1 Initialize the Bun/TypeScript project (`package.json`, `tsconfig.json`) and verify `bun run` executes a placeholder entry file
- [x] 1.2 Configure linting/formatting (Biome) and verify the lint command passes on a clean tree
- [x] 1.3 Add an MIT `LICENSE` and a full README, verify both files exist at the repo root

## 2. Parser-Adapters Capability

- [ ] 2.1 Define the `ChatAdapter` interface and normalized `Session`/`Message` types, verify the project type-checks with no implicit `any` in the interface
- [ ] 2.2 Implement the Claude Code adapter reading `~/.claude/projects/**/*.jsonl`, verify a unit test parses a fixture JSONL file into the expected normalized session
- [ ] 2.3 Resolve each session's real project path from the JSONL events' `cwd` field (not by decoding the sanitized folder name), verify a fixture whose real path contains a literal `-` still resolves correctly
- [ ] 2.4 Handle malformed/corrupt session files without aborting the indexing run, verify a unit test with a corrupt fixture file logs a warning and the run still completes
- [ ] 2.5 Support the Windows home-directory equivalent for the Claude Code adapter, verify a test with a mocked Windows path resolves the correct projects directory

## 3. Chat-Indexing Capability

- [ ] 3.1 Set up the `bun:sqlite` database with an FTS5 virtual table schema, verify an init script creates the expected schema on a fresh file
- [ ] 3.2 Implement a full index build from all registered adapters' sessions, verify running it against fixture sessions populates the expected row count
- [ ] 3.3 Implement incremental re-indexing based on source file mtime, verify a test that touches one fixture file only re-parses that file
- [ ] 3.4 Prune index rows for session files that no longer exist on disk, verify a test that deletes a fixture file also removes its rows after re-index
- [ ] 3.5 Resolve the OS-appropriate config/cache directory for the index file, verify it resolves to the correct path on macOS, Linux, and Windows via unit tests with mocked platform info

## 4. Search Capability

- [ ] 4.1 Implement free-text query against the FTS5 index with relevance ranking, verify a test query returns and ranks the expected fixture sessions
- [ ] 4.2 Implement the case-sensitive/case-insensitive toggle, verify a test asserts case-sensitive mode excludes a differently-cased match
- [ ] 4.3 Implement whole-word match mode, verify a test asserts a substring like "login" does not match a whole-word query for "log"
- [ ] 4.4 Implement regex search mode with invalid-pattern handling, verify tests cover a valid pattern returning matches and an invalid pattern returning a clean error instead of crashing

## 5. TUI Capability

- [ ] 5.1 Scaffold the Ink app shell (search input, result list, preview pane layout), verify the dev command launches the TUI without errors
- [ ] 5.2 Wire live search-as-you-type to the search capability, verify manually that typing updates the result list without a submit action
- [ ] 5.3 Implement keyboard navigation across the result list, verify manually that up/down changes the selection and updates the preview pane
- [ ] 5.4 Render the selected chat as Markdown (including code blocks) in the preview pane, verify manually against a fixture chat containing code blocks
- [ ] 5.5 Manually verify the TUI renders and accepts keyboard input correctly in a real terminal on macOS, Linux, and Windows

## 6. Export Capability

- [ ] 6.1 Implement the "copy as Markdown" clipboard action, verify clipboard contents match the expected Markdown for a fixture chat
- [ ] 6.2 Implement the "copy as JSON" clipboard action, verify clipboard contents parse as valid JSON matching the normalized session
- [ ] 6.3 Implement "open containing file" using the OS default file manager, verify manually on macOS (Finder), Linux (`xdg-open`), and Windows (Explorer)

## 7. Cross-Platform Distribution Capability

- [ ] 7.1 Add `bun build --compile` scripts per target (macOS x64/arm64, Linux x64/arm64, Windows x64), verify each produces a runnable binary locally
- [ ] 7.2 Set up a GitHub Actions release workflow that builds all targets and attaches them to a tagged GitHub Release, verify a test tag push produces a release with all binary assets
- [ ] 7.3 Smoke-test each built binary launches without a pre-installed runtime, verify by running each binary in a clean CI container/VM with no Bun/Node installed

## 8. Documentation & Release Readiness

- [ ] 8.1 Write the full README (install instructions, usage, screenshots, contribution guidelines), verify it renders correctly in GitHub's Markdown preview
- [ ] 8.2 Add `CONTRIBUTING.md` covering the fork/PR flow, verify all internal links resolve
- [ ] 8.3 Tag and publish the first GitHub Release (`v0.1.0`), verify the release page lists working binary downloads for all three OSes
