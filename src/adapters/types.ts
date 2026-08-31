/**
 * Common contract every chat-source adapter must implement.
 * See ARCHITECTURE.md#adapter-contract and the `parser-adapters` spec.
 */
export interface ChatAdapter {
  readonly id: string;
  discover(rootDir?: string): Promise<Session[]>;
}

export interface Session {
  id: string;
  /** id of the adapter that produced this session */
  source: string;
  /**
   * The project's real path. Must come from the event's own content (e.g.
   * Claude Code's JSONL `cwd` field) — never decoded from the folder name,
   * which is an ambiguous transformation (`/` → `-`).
   */
  projectPath: string;
  /** Source file on disk. */
  filePath: string;
  mtimeMs: number;
  messages: Message[];
}

export type MessageRole = "user" | "assistant" | "tool";

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: string;
}
