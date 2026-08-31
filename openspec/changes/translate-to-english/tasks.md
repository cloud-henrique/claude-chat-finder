## 1. Top-Level Docs

- [ ] 1.1 Translate `README.md` to English, verify all internal links and code blocks still resolve/render correctly
- [ ] 1.2 Translate `ARCHITECTURE.md` to English, including the Mermaid diagram's node labels, verify the diagram still renders on GitHub
- [ ] 1.3 Translate `CLAUDE.md` to English, verify it reads correctly as project instructions

## 2. OpenSpec Artifacts (bootstrap-mvp)

- [ ] 2.1 Translate `openspec/changes/bootstrap-mvp/proposal.md` to English, verify `openspec validate bootstrap-mvp --strict` still passes
- [ ] 2.2 Translate `openspec/changes/bootstrap-mvp/design.md` to English, verify `openspec validate bootstrap-mvp --strict` still passes
- [ ] 2.3 Translate `openspec/changes/bootstrap-mvp/tasks.md` to English, preserving existing checkbox states (`[x]`/`[ ]`) exactly, verify `openspec status --change bootstrap-mvp` still reports the same progress
- [ ] 2.4 Translate all six `openspec/changes/bootstrap-mvp/specs/*/spec.md` files to English, preserving `### Requirement:` / `#### Scenario:` structure and SHALL/MUST/WHEN/THEN phrasing exactly, verify `openspec validate bootstrap-mvp --strict` still passes after each file

## 3. Code & Metadata

- [ ] 3.1 Translate the Portuguese comment in `src/adapters/types.ts` to English, verify `bun run typecheck` and `bun run lint` still pass
- [ ] 3.2 Translate `package.json`'s `description` field to English, verify `bun run lint` still passes
- [ ] 3.3 Update the GitHub repository description to English via `gh repo edit --description "..."`, verify with `gh repo view --json description`

## 4. Final Check

- [ ] 4.1 Search the repository for any remaining Portuguese-only prose outside of git history, verify nothing unintended was missed
