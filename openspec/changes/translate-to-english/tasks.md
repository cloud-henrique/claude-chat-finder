## 1. Top-Level Docs

- [x] 1.1 Translate `README.md` to English, verify all internal links and code blocks still resolve/render correctly
- [x] 1.2 Translate `ARCHITECTURE.md` to English, including the Mermaid diagram's node labels, verify the diagram still renders on GitHub
- [x] 1.3 Translate `CLAUDE.md` to English, verify it reads correctly as project instructions

## 2. OpenSpec Artifacts (bootstrap-mvp)

- [x] 2.1 Translate `openspec/changes/bootstrap-mvp/proposal.md` to English — already written in English at creation time, no changes needed; verified `openspec validate bootstrap-mvp --strict` still passes
- [x] 2.2 Translate `openspec/changes/bootstrap-mvp/design.md` to English — already written in English at creation time, no changes needed; verified `openspec validate bootstrap-mvp --strict` still passes
- [x] 2.3 Translate `openspec/changes/bootstrap-mvp/tasks.md` to English — already written in English at creation time, no changes needed; verified `openspec status --change bootstrap-mvp` still reports the same progress
- [x] 2.4 Translate all six `openspec/changes/bootstrap-mvp/specs/*/spec.md` files to English — already written in English at creation time, no changes needed; verified `openspec validate bootstrap-mvp --strict` still passes
- [x] 2.5 Translate `openspec/changes/bootstrap-mvp/README.md` (the auto-generated change summary stub, missed in the original task breakdown) to English

## 3. Code & Metadata

- [x] 3.1 Translate the Portuguese comment in `src/adapters/types.ts` to English, verify `bun run typecheck` and `bun run lint` still pass
- [x] 3.2 Translate `package.json`'s `description` field to English, verify `bun run lint` still passes
- [x] 3.3 Translate the placeholder string in `src/cli.ts` (missed in the original task breakdown) to English, verify `bun run dev` still prints correctly
- [x] 3.4 Update the GitHub repository description to English via `gh repo edit --description "..."`, verified with `gh repo view --json description`

## 4. Final Check

- [x] 4.1 Search the repository for any remaining Portuguese-only prose outside of git history — `git ls-files | xargs grep` for Portuguese-accented characters returned no matches after this change
