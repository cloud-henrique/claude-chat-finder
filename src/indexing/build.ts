import type { Database } from "bun:sqlite";
import type { ChatAdapter, Session } from "../adapters/types";

export interface IndexStats {
  sessionsIndexed: number;
  sessionsUnchanged: number;
  sessionsPruned: number;
}

/**
 * Builds/refreshes the index from every registered adapter's sessions:
 * re-parses only new or changed files (by `mtimeMs`) and prunes rows for
 * sessions whose source file no longer exists.
 */
export async function buildIndex(
  db: Database,
  adapters: ChatAdapter[],
): Promise<IndexStats> {
  const stats: IndexStats = {
    sessionsIndexed: 0,
    sessionsUnchanged: 0,
    sessionsPruned: 0,
  };

  for (const adapter of adapters) {
    const sessions = await adapter.discover();

    stats.sessionsPruned += pruneMissingSessions(db, adapter.id, sessions);

    for (const session of sessions) {
      if (isUpToDate(db, session)) {
        stats.sessionsUnchanged++;
        continue;
      }
      indexSession(db, session);
      stats.sessionsIndexed++;
    }
  }

  return stats;
}

function isUpToDate(db: Database, session: Session): boolean {
  const row = db
    .query<{ mtime_ms: number }, [string, string]>(
      "SELECT mtime_ms FROM sessions WHERE source = ? AND id = ?",
    )
    .get(session.source, session.id);
  return row !== null && row.mtime_ms === session.mtimeMs;
}

function indexSession(db: Database, session: Session): void {
  const replace = db.transaction((s: Session) => {
    db.run("DELETE FROM sessions WHERE source = ? AND id = ?", [
      s.source,
      s.id,
    ]);
    db.run("DELETE FROM messages_fts WHERE source = ? AND session_id = ?", [
      s.source,
      s.id,
    ]);

    db.run(
      "INSERT INTO sessions (source, id, project_path, file_path, mtime_ms) VALUES (?, ?, ?, ?, ?)",
      [s.source, s.id, s.projectPath, s.filePath, s.mtimeMs],
    );

    // db.query() caches the compiled statement per SQL string, so this doesn't
    // recompile on every message.
    const insertMessage = db.query(
      "INSERT INTO messages_fts (content, source, session_id, role, timestamp, seq) VALUES (?, ?, ?, ?, ?, ?)",
    );
    s.messages.forEach((message, seq) => {
      insertMessage.run(
        message.content,
        s.source,
        s.id,
        message.role,
        message.timestamp,
        seq,
      );
    });
  });
  replace(session);
}

function pruneMissingSessions(
  db: Database,
  source: string,
  currentSessions: Session[],
): number {
  const currentIds = new Set(currentSessions.map((session) => session.id));
  const existingIds = db
    .query<{ id: string }, [string]>("SELECT id FROM sessions WHERE source = ?")
    .all(source)
    .map((row) => row.id);
  const staleIds = existingIds.filter((id) => !currentIds.has(id));
  if (staleIds.length === 0) return 0;

  const prune = db.transaction((ids: string[]) => {
    for (const id of ids) {
      db.run("DELETE FROM sessions WHERE source = ? AND id = ?", [source, id]);
      db.run("DELETE FROM messages_fts WHERE source = ? AND session_id = ?", [
        source,
        id,
      ]);
    }
  });
  prune(staleIds);

  return staleIds.length;
}
