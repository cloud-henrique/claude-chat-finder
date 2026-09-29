import type { Database } from "bun:sqlite";
import type { MessageRole } from "../adapters/types";

export interface IndexedMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
  seq: number;
}

export interface IndexedSession {
  source: string;
  id: string;
  projectPath: string;
  filePath: string;
  mtimeMs: number;
  messages: IndexedMessage[];
}

interface SessionRow {
  source: string;
  id: string;
  project_path: string;
  file_path: string;
  mtime_ms: number;
}

/**
 * Reads a full indexed session (metadata + every message, in order) back out
 * of the index, so consumers never have to re-parse the source file.
 *
 * FTS5 stores every column as text, so `seq` is cast back to an integer
 * before ordering — a lexicographic sort would put message 10 before 2.
 */
export function loadSession(
  db: Database,
  source: string,
  id: string,
): IndexedSession | null {
  const meta = db
    .query<SessionRow, [string, string]>(
      "SELECT source, id, project_path, file_path, mtime_ms FROM sessions WHERE source = ? AND id = ?",
    )
    .get(source, id);
  if (!meta) return null;

  const messages = db
    .query<IndexedMessage, [string, string]>(
      `SELECT role, content, timestamp, CAST(seq AS INTEGER) AS seq
       FROM messages_fts
       WHERE source = ? AND session_id = ?
       ORDER BY seq`,
    )
    .all(source, id);

  return {
    source: meta.source,
    id: meta.id,
    projectPath: meta.project_path,
    filePath: meta.file_path,
    mtimeMs: meta.mtime_ms,
    messages,
  };
}
