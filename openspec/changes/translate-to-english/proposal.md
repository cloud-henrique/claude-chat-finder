## Why

This project targets a global developer audience — anyone using Claude Code, regardless of language — and depends on English-language discoverability (GitHub search, stars, contributors, PRs) to grow as intended. Every doc and OpenSpec artifact so far was written in Portuguese during initial planning. A direct reference project in this space ([claude-code-history-viewer](https://github.com/jhlee0409/claude-code-history-viewer)) ships English as its default/canonical language with translations as secondary options, confirming English is the baseline expectation for this category of open-source tool. This is a pure content change: no application behavior is affected.

## What Changes

- Translate `README.md`, `ARCHITECTURE.md`, and `CLAUDE.md` to English; English becomes the single canonical language for project docs (no bilingual maintenance burden for a solo-maintained project at this stage).
- Translate all existing OpenSpec artifacts under `openspec/changes/bootstrap-mvp/` (`proposal.md`, `design.md`, `tasks.md`, and all six `specs/*/spec.md` files) to English.
- Translate the Portuguese inline comment in `src/adapters/types.ts` and any other Portuguese code comments introduced so far.
- Update `package.json`'s `description` field to English.
- Update the GitHub repository's description (currently in Portuguese) to match.
- Going forward, English is the project's working language for docs, code comments, commit messages, and OpenSpec artifacts. This is a policy statement for future contributions, not something enforced by tooling in this change.

## Capabilities

### New Capabilities
None — this is a zero-behavior-change documentation/content change (`skip_specs: true` set in `.openspec.yaml`).

### Modified Capabilities
None.

## Impact

- Files: `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `package.json`, `src/adapters/types.ts`, and every artifact under `openspec/changes/bootstrap-mvp/`.
- GitHub repository metadata: description field (via `gh repo edit`).
- No application code behavior changes; no specs change (translation does not alter documented system behavior).
