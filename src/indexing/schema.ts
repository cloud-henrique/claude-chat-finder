import type { Database } from "bun:sqlite";

/**
 * Creates the index schema if it doesn't already exist: one `sessions` table
 * for metadata (used to detect changed/deleted source files) and one FTS5
 * virtual table for message content search.
 */
export function ensureSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      source TEXT NOT NULL,
      id TEXT NOT NULL,
      project_path TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mtime_ms REAL NOT NULL,
      PRIMARY KEY (source, id)
    )
  `);

  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
      content,
      source UNINDEXED,
      session_id UNINDEXED,
      role UNINDEXED,
      timestamp UNINDEXED,
      seq UNINDEXED
    )
  `);
}
