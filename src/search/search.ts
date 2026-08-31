import type { Database } from "bun:sqlite";
import type { MessageRole } from "../adapters/types";

export interface SearchOptions {
  /** Defaults to false (case-insensitive). */
  caseSensitive?: boolean;
  /** Defaults to false (substring/prefix matching). */
  wholeWord?: boolean;
  /** Treat `query` as a regular expression instead of a literal term. */
  regex?: boolean;
}

export interface SearchMatch {
  role: MessageRole;
  content: string;
  timestamp: string;
  seq: number;
}

export interface SearchResult {
  source: string;
  id: string;
  projectPath: string;
  filePath: string;
  matches: SearchMatch[];
}

export class InvalidRegexError extends Error {
  constructor(pattern: string, cause: unknown) {
    super(
      `Invalid regular expression "${pattern}": ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    this.name = "InvalidRegexError";
  }
}

// SQLite's regex engine (via the JS RegExp we run per row) has no built-in
// backtracking guard, so a pathological pattern against a huge message could
// hang the search. Bounding the input per message is the accepted MVP-level
// mitigation (see design.md's Risks section) — it doesn't prevent
// catastrophic backtracking, just caps how bad any single message can be.
const MAX_REGEX_INPUT_LENGTH = 10_000;

interface CandidateRow {
  source: string;
  session_id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  seq: number;
}

interface RankedRow extends CandidateRow {
  rank: number;
}

interface SessionMetaRow {
  source: string;
  id: string;
  project_path: string;
  file_path: string;
}

/**
 * Searches indexed message content and returns matching sessions ranked by
 * relevance (FTS5 `bm25()` for free-text/whole-word modes; match count for
 * regex mode, which bypasses the FTS5 index entirely).
 */
export function searchSessions(
  db: Database,
  query: string,
  options: SearchOptions = {},
): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  return options.regex
    ? searchByRegex(db, trimmed, options)
    : searchByFts(db, trimmed, options);
}

function searchByFts(
  db: Database,
  query: string,
  options: SearchOptions,
): SearchResult[] {
  const tokens = query.split(/\s+/).filter(Boolean);
  const wholeWord = options.wholeWord ?? false;

  // FTS5's default tokenizer already splits on word boundaries, so a bare
  // token match is inherently whole-word. Non-whole-word mode instead uses a
  // prefix query (`"term"*`) so "log" also surfaces "login" while typing.
  const matchQuery = tokens
    .map((token) => {
      const escaped = token.replace(/"/g, '""');
      return wholeWord ? `"${escaped}"` : `"${escaped}"*`;
    })
    .join(" ");

  const rows = db
    .query<
      RankedRow,
      [string]
    >(`SELECT source, session_id, role, content, timestamp, seq, bm25(messages_fts) as rank
       FROM messages_fts
       WHERE messages_fts MATCH ?
       ORDER BY rank`)
    .all(matchQuery);

  const filtered = options.caseSensitive
    ? rows.filter((row) => matchesCaseSensitive(row.content, tokens, wholeWord))
    : rows;

  return groupIntoSessions(db, filtered);
}

function matchesCaseSensitive(
  content: string,
  tokens: string[],
  wholeWord: boolean,
): boolean {
  return tokens.every((token) =>
    wholeWord
      ? new RegExp(`\\b${escapeRegExp(token)}\\b`).test(content)
      : content.includes(token),
  );
}

function searchByRegex(
  db: Database,
  pattern: string,
  options: SearchOptions,
): SearchResult[] {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, options.caseSensitive ? "" : "i");
  } catch (cause) {
    throw new InvalidRegexError(pattern, cause);
  }

  const rows = db
    .query<CandidateRow, []>(
      "SELECT source, session_id, role, content, timestamp, seq FROM messages_fts",
    )
    .all();

  const matched = rows.filter((row) =>
    regex.test(row.content.slice(0, MAX_REGEX_INPUT_LENGTH)),
  );

  return groupIntoSessions(db, matched);
}

function groupIntoSessions(
  db: Database,
  rows: (CandidateRow & { rank?: number })[],
): SearchResult[] {
  const bySession = new Map<
    string,
    { source: string; id: string; matches: SearchMatch[]; bestRank: number }
  >();

  for (const row of rows) {
    const key = `${row.source}:${row.session_id}`;
    let entry = bySession.get(key);
    if (!entry) {
      entry = {
        source: row.source,
        id: row.session_id,
        matches: [],
        bestRank: Infinity,
      };
      bySession.set(key, entry);
    }
    entry.matches.push({
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      seq: row.seq,
    });
    if (row.rank !== undefined && row.rank < entry.bestRank) {
      entry.bestRank = row.rank;
    }
  }

  const metaByKey = fetchSessionMeta(db, [...bySession.values()]);

  const results: SearchResult[] = [];
  for (const entry of bySession.values()) {
    const key = `${entry.source}:${entry.id}`;
    const meta = metaByKey.get(key);
    if (!meta) continue; // stale FTS row without a session row (shouldn't happen post-prune)

    entry.matches.sort((a, b) => a.seq - b.seq);
    results.push({
      source: entry.source,
      id: entry.id,
      projectPath: meta.project_path,
      filePath: meta.file_path,
      matches: entry.matches,
    });
  }

  results.sort((a, b) => {
    const rankA = bySession.get(`${a.source}:${a.id}`)?.bestRank ?? Infinity;
    const rankB = bySession.get(`${b.source}:${b.id}`)?.bestRank ?? Infinity;
    if (rankA !== rankB) return rankA - rankB;
    return b.matches.length - a.matches.length;
  });

  return results;
}

function fetchSessionMeta(
  db: Database,
  keys: { source: string; id: string }[],
): Map<string, SessionMetaRow> {
  if (keys.length === 0) return new Map();

  const placeholders = keys.map(() => "(source = ? AND id = ?)").join(" OR ");
  const params = keys.flatMap((k) => [k.source, k.id]);
  const rows = db
    .query<SessionMetaRow, string[]>(
      `SELECT source, id, project_path, file_path FROM sessions WHERE ${placeholders}`,
    )
    .all(...params);

  return new Map(rows.map((row) => [`${row.source}:${row.id}`, row]));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
