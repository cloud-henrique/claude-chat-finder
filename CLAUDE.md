# CLAUDE.md

Contexto de projeto para o Claude Code trabalhando neste repositório.

## O que é este projeto

`claude-chat-finder` (binário: `ccf`) é uma TUI open source para buscar, indexar e navegar no histórico local de chats do Claude Code (`~/.claude/projects/**/*.jsonl`). Veja [`README.md`](README.md) para a visão de produto e [`ARCHITECTURE.md`](ARCHITECTURE.md) para o desenho técnico.

O projeto está sendo desenvolvido com [OpenSpec](https://github.com/Fission-AI/OpenSpec) (spec-driven development). A primeira mudança, com toda a proposta/specs/design/tarefas, está em [`openspec/changes/bootstrap-mvp/`](openspec/changes/bootstrap-mvp/).

## Stack

- **Runtime**: Bun (não Node puro — usa `bun:sqlite` e `bun build --compile`)
- **Linguagem**: TypeScript
- **TUI**: Ink (componentes ao estilo React)
- **Índice de busca**: SQLite FTS5 via `bun:sqlite`
- **Distribuição**: binários únicos por SO via `bun build --compile`, publicados em GitHub Releases

## Comandos (uma vez que o projeto esteja inicializado)

```bash
bun install       # instalar dependências
bun run dev       # rodar a TUI em modo desenvolvimento
bun test          # rodar testes
bun run lint      # lint/format
bun run build     # gerar binário local via bun build --compile
```

## Fluxo de trabalho com OpenSpec

Este repo usa OpenSpec para mudanças não-triviais (nova capability, mudança de comportamento observável). Fluxo:

1. `/opsx:propose "descrição da ideia"` — cria `openspec/changes/<nome>/` com proposal, specs, design e tasks
2. Revisar os artefatos antes de implementar
3. `/opsx:apply` — implementa `tasks.md` do change ativo
4. `/opsx:archive` — arquiva o change e sincroniza `openspec/specs/` como fonte da verdade

Para correções pequenas (typo, bug isolado, sem mudança de comportamento observável), não é necessário abrir um change — pode editar direto.

**Change ativo no momento**: `bootstrap-mvp` (MVP completo — todas as 6 capabilities). Ver [`tasks.md`](openspec/changes/bootstrap-mvp/tasks.md) para o checklist de implementação em ordem.

## Convenções e restrições do projeto

- **Zero rede, zero telemetria.** O histórico de chat indexado pode conter código e segredos sensíveis do usuário. Nenhuma chamada de rede deve ser adicionada em nenhum módulo do core (adapters, indexing, search). Isso é um requirement, não uma preferência de estilo — está em [`cross-platform-distribution`](openspec/changes/bootstrap-mvp/specs/cross-platform-distribution/spec.md) e no design.md.
- **Path do projeto vem do `cwd` do evento, nunca do nome da pasta decodificado.** O Claude Code sanitiza `/` → `-` no nome da pasta de forma ambígua (um path com hífen literal não é reversível). Sempre ler o path real do campo `cwd` dentro do próprio JSONL. Ver gotcha detalhado em [`ARCHITECTURE.md`](ARCHITECTURE.md#contrato-do-adapter).
- **Módulos de indexação/busca/TUI nunca conhecem o formato bruto de um adapter.** Tudo passa pelo modelo normalizado `Session`/`Message` definido pela interface `ChatAdapter`. Ao adicionar um adapter novo, ele deve implementar essa interface — não vaze detalhes do formato de origem para fora de `src/adapters/`.
- **Cross-platform de verdade.** macOS, Linux e Windows são todos alvo do MVP. Qualquer código que toque path de filesystem, diretório de config ou abertura do file manager do SO precisa considerar os três — sem assumir POSIX-only.
- **Sem abstrações prematuras.** Só existe um adapter (Claude Code) no MVP; a interface existe para não travar um adapter futuro, não para generalizar código que ainda não tem um segundo caso de uso real.

## Testes

Cada requirement nas specs de `openspec/changes/bootstrap-mvp/specs/*/spec.md` tem cenários no formato WHEN/THEN pensados para virar casos de teste. Ao implementar uma tarefa de `tasks.md`, o critério de verificação já está descrito no próprio item da tarefa.
