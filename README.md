# claude-chat-finder

Encontre qualquer conversa antiga que você já teve com o [Claude Code](https://claude.com/claude-code) — em segundos, direto do terminal.

> 🚧 **Status: em planejamento/implementação inicial.** O plano completo (proposta, specs e tarefas) já está definido em [`openspec/changes/bootstrap-mvp`](openspec/changes/bootstrap-mvp/proposal.md). Este README descreve o comportamento alvo do MVP e será atualizado conforme o código avança.

## O problema

O Claude Code guarda cada conversa como arquivos JSONL em `~/.claude/projects/`, mas não existe uma forma de achar um chat específico além de rodar `grep` manualmente em cada pasta de projeto. Quem usa o Claude Code todo dia (terminal, extensão do VS Code, ou qualquer outra integração que compartilhe o mesmo armazenamento local) acumula centenas de sessões e não tem como buscar, ver preview ou recuperar uma conversa antiga rapidamente.

`claude-chat-finder` (`ccf`) resolve isso: um binário único, sem dependências, que indexa seu histórico local e te dá uma TUI rápida pra buscar nele.

## Features

- 🔍 **Busca full-text instantânea** sobre todo o seu histórico, via índice local (SQLite FTS5)
- 🎛️ **Modos de busca**: case sensitive/insensitive, whole word, regex
- 🖥️ **TUI interativa**: navegação por teclado, busca ao digitar, preview em Markdown
- 📋 **Copiar chat** como Markdown ou como JSON
- 📂 **Abrir no Finder/Explorer**: pula direto pro arquivo `.jsonl` da sessão
- 🧩 **Arquitetura com adapters**: hoje só lê o formato do Claude Code, mas a interface já é pensada pra outras ferramentas de AI CLI no futuro
- 🔒 **100% local e offline**: nenhuma chamada de rede, nenhuma telemetria — seu histórico de chat pode conter código e segredos sensíveis
- 💻 **Cross-platform**: macOS, Linux e Windows, sem exigir Node/Bun instalado

Detalhes de comportamento (com cenários testáveis) estão nas specs de cada capability em [`openspec/changes/bootstrap-mvp/specs/`](openspec/changes/bootstrap-mvp/specs/).

## Instalação

### Binário pré-compilado (recomendado, assim que a primeira release sair)

```bash
curl -fsSL https://raw.githubusercontent.com/cloud-henrique/claude-chat-finder/main/install.sh | sh
```

Binários para macOS, Linux e Windows serão publicados em [GitHub Releases](../../releases) — nenhum runtime precisa estar instalado.

### A partir do código-fonte (para contribuir)

Requer [Bun](https://bun.sh) instalado.

```bash
git clone https://github.com/cloud-henrique/claude-chat-finder.git
cd claude-chat-finder
bun install
bun run dev
```

Para gerar um binário local:

```bash
bun run build
```

## Uso

```bash
ccf
```

Isso abre a TUI já indexando (ou reindexando incrementalmente) o seu histórico do Claude Code.

| Ação | Atalho |
|---|---|
| Buscar | digitar (busca ao vivo, sem precisar apertar Enter) |
| Navegar resultados | `↑` / `↓` |
| Ver preview do chat selecionado | seleção automática ao navegar |
| Copiar chat como Markdown | `c` `m` (a definir na implementação) |
| Copiar chat como JSON | `c` `j` (a definir na implementação) |
| Abrir arquivo no Finder/Explorer | `o` (a definir na implementação) |
| Alternar case sensitive / whole word / regex | menu de opções de busca |
| Sair | `Esc` / `Ctrl+C` |

> Os atalhos exatos serão confirmados durante a implementação da capability [`tui`](openspec/changes/bootstrap-mvp/specs/tui/spec.md) e atualizados aqui.

## Como funciona

Visão rápida: adapters leem os arquivos de chat da fonte (hoje, só Claude Code) → um indexador normaliza e grava tudo num SQLite FTS5 local → a busca consulta esse índice → a TUI mostra e deixa exportar os resultados.

Detalhes de arquitetura, decisões técnicas e trade-offs estão em [`ARCHITECTURE.md`](ARCHITECTURE.md) e em [`openspec/changes/bootstrap-mvp/design.md`](openspec/changes/bootstrap-mvp/design.md).

## Configuração

O índice local fica no diretório de config/cache padrão do seu SO (ex.: `~/Library/Application Support/claude-chat-finder` no macOS, XDG no Linux, `%LOCALAPPDATA%\claude-chat-finder` no Windows). Nenhuma configuração manual é necessária para o uso básico.

## Privacidade

Este projeto não faz nenhuma chamada de rede e não coleta telemetria. Todo o processamento — leitura dos arquivos, indexação e busca — acontece localmente na sua máquina, porque seu histórico de chat pode conter informações sensíveis do seu código e dos seus projetos.

## Contribuindo

Projeto open source (MIT) — forks, issues e PRs são bem-vindos.

Este repositório usa [OpenSpec](https://github.com/Fission-AI/OpenSpec) para planejamento orientado a specs. Para propor uma mudança maior (nova capability, mudança de comportamento), abra uma proposta antes do código:

```bash
openspec init          # se ainda não tiver o CLI configurado localmente
/opsx:propose "sua ideia aqui"
```

Specs vigentes ficam em `openspec/specs/`, mudanças em andamento em `openspec/changes/`. Para correções pequenas (typo, bug simples), um PR direto já é suficiente.

## Licença

MIT — veja [`LICENSE`](LICENSE).
