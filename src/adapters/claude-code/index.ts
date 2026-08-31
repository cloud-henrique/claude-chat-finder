import type { ChatAdapter, Session } from "../types";
import { CLAUDE_CODE_ADAPTER_ID, parseSessionFile } from "./parse";
import { resolveClaudeProjectsRoot } from "./paths";

/**
 * Reads Claude Code session files from `~/.claude/projects/**\/*.jsonl`
 * (or the Windows-equivalent home directory) and normalizes them.
 */
export class ClaudeCodeAdapter implements ChatAdapter {
  readonly id = CLAUDE_CODE_ADAPTER_ID;

  async discover(
    rootDir: string = resolveClaudeProjectsRoot(),
  ): Promise<Session[]> {
    const glob = new Bun.Glob("**/*.jsonl");
    const files: string[] = [];
    try {
      for await (const file of glob.scan({
        cwd: rootDir,
        absolute: true,
        onlyFiles: true,
      })) {
        files.push(file);
      }
    } catch {
      // Root directory doesn't exist (e.g. Claude Code was never installed) — no sessions.
      return [];
    }

    const sessions = await Promise.all(
      files.map((file) => parseSessionFile(file)),
    );
    return sessions.filter((session): session is Session => session !== null);
  }
}
