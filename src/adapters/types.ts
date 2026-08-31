/**
 * Contrato comum que todo adapter de fonte de chat deve implementar.
 * Ver ARCHITECTURE.md#contrato-do-adapter e a spec `parser-adapters`.
 */
export interface ChatAdapter {
  readonly id: string;
  discover(rootDir?: string): Promise<Session[]>;
}

export interface Session {
  id: string;
  /** id do adapter que produziu esta sessão */
  source: string;
  /**
   * Path real do projeto. Deve vir do próprio conteúdo do evento (ex.: campo
   * `cwd` do JSONL do Claude Code) — nunca decodificado do nome da pasta,
   * que é uma transformação ambígua (`/` → `-`).
   */
  projectPath: string;
  /** Arquivo de origem no disco. */
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
