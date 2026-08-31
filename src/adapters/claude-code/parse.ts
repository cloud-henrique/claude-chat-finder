import { basename } from "node:path";
import type { Message, MessageRole, Session } from "../types";

export const CLAUDE_CODE_ADAPTER_ID = "claude-code";

const CHAT_ROLES = new Set<string>(["user", "assistant"]);

interface RawContentBlock {
  type?: string;
  text?: string;
}

interface RawEvent {
  type?: string;
  cwd?: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: string | RawContentBlock[];
  };
}

// Claude Code messages carry thinking/tool_use/tool_result/image blocks alongside
// text. Only "text" blocks are natural-language content worth indexing for search.
function extractText(content: string | RawContentBlock[] | undefined): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n");
}

/**
 * Parses one Claude Code session `.jsonl` file into a normalized `Session`.
 * Returns null (after logging a warning) if the file is corrupt or has no
 * recoverable project path, so one bad file doesn't abort the indexing run.
 */
export async function parseSessionFile(
  filePath: string,
): Promise<Session | null> {
  const file = Bun.file(filePath);
  const text = await file.text();
  const lines = text.split("\n");

  const messages: Message[] = [];
  let projectPath: string | undefined;

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber]?.trim();
    if (!line) continue;

    let event: RawEvent;
    try {
      event = JSON.parse(line);
    } catch {
      console.warn(
        `[claude-code adapter] Skipping ${filePath}: invalid JSON on line ${lineNumber + 1}`,
      );
      return null;
    }

    if (!projectPath && typeof event.cwd === "string") {
      projectPath = event.cwd;
    }

    const role = event.message?.role;
    if (!role || !CHAT_ROLES.has(role)) continue;

    messages.push({
      role: role as MessageRole,
      content: extractText(event.message?.content),
      timestamp: event.timestamp ?? "",
    });
  }

  if (!projectPath) {
    console.warn(
      `[claude-code adapter] Skipping ${filePath}: no cwd found in any event`,
    );
    return null;
  }

  return {
    id: basename(filePath, ".jsonl"),
    source: CLAUDE_CODE_ADAPTER_ID,
    projectPath,
    filePath,
    mtimeMs: file.lastModified,
    messages,
  };
}
