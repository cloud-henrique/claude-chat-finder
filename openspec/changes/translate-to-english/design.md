## Context

See proposal.md - Why. All code identifiers (`ChatAdapter`, `Session`, `Message`, file/folder names) were already written in English from the start — only prose (docs, OpenSpec artifacts, one inline comment) is in Portuguese. This change is cross-cutting in the sense that it touches nearly every existing file in the repo, even though each individual edit is a straightforward translation with no logic change.

## Goals / Non-Goals

**Goals:**
- Every existing doc and OpenSpec artifact reads naturally in English, not as a literal/mechanical translation.
- Terminology stays consistent across files (e.g., always "chat history", not mixing "conversation history" / "chat log" arbitrarily).
- Nothing that was already in English (code, identifiers, file paths, commands) gets touched or accidentally altered.

**Non-Goals:**
- No bilingual (PT + EN) documentation. English fully replaces Portuguese; this change does not add an i18n system for docs.
- No change to OpenSpec's own structure, schema, or the meaning of any requirement/scenario — only the language they're written in.
- No UI-string translation system for the future TUI (out of scope until the TUI has user-facing strings at all).

## Decisions

### English fully replaces Portuguese (no bilingual docs)
Alternative considered: keep a `README.pt-BR.md` alongside an English `README.md`, similar to how the reference project (`claude-code-history-viewer`) ships 5 language variants. Rejected for now: maintaining parallel docs is real ongoing overhead for a solo maintainer at MVP stage, and every edit would need to land in two places or drift. If community demand for a Portuguese translation shows up later, it can be reintroduced as a `README.pt-BR.md` fork of the (by then stable) English version — translating a finished doc once is cheap; keeping two moving targets in sync is not.

### Translate OpenSpec artifacts in place, not just prose docs
The `bootstrap-mvp` change's `proposal.md`, `design.md`, `tasks.md`, and all `specs/*/spec.md` files get translated too, not just the top-level README/ARCHITECTURE/CLAUDE.md. Rationale: these are the project's source of truth for requirements (per `CLAUDE.md`'s own OpenSpec workflow section) and will be read by every future contributor and by Claude Code itself in later sessions — leaving them in Portuguese while everything else is English would make the project's actual specs less accessible than its docs.

### Preserve exact spec formatting during translation
When translating `specs/*/spec.md`, requirement/scenario structure (`### Requirement:`, `#### Scenario:`, `**WHEN**`/`**THEN**`, SHALL/MUST phrasing) must be preserved exactly — only the prose inside each block changes language. After translating, re-run `openspec validate bootstrap-mvp --strict` to confirm the change is still valid.

## Risks / Trade-offs

- [Translation drift changes the precise meaning of a requirement] → Translate requirement/scenario text carefully, keep sentences short and literal rather than idiomatic where precision matters (SHALL/MUST/WHEN/THEN blocks), and re-validate with `openspec validate` after each spec file.
- [Losing nuance from decisions already agreed with the user in Portuguese, e.g. the `cwd`-vs-folder-name gotcha] → Translate design rationale sentence-by-sentence rather than summarizing, so no reasoning is silently dropped.
