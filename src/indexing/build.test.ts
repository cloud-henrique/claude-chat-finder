import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import type { ChatAdapter, Session } from "../adapters/types";
import { buildIndex } from "./build";
import { ensureSchema } from "./schema";

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    source: "fake",
    projectPath: "/Users/test/project",
    filePath: "/fake/s1.jsonl",
    mtimeMs: 1000,
    messages: [
      {
        role: "user",
        content: "hello there",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
      {
        role: "assistant",
        content: "hi, general kenobi",
        timestamp: "2026-01-01T00:00:01.000Z",
      },
    ],
    ...overrides,
  };
}

class FakeAdapter implements ChatAdapter {
  readonly id: string;
  sessions: Session[];

  constructor(sessions: Session[], id = "fake") {
    this.sessions = sessions;
    this.id = id;
  }

  async discover(): Promise<Session[]> {
    return this.sessions;
  }
}

function freshDb(): Database {
  const db = new Database(":memory:");
  ensureSchema(db);
  return db;
}

function countRows(db: Database, table: "sessions" | "messages_fts"): number {
  const row = db
    .query<{ c: number }, []>(`SELECT count(*) as c FROM ${table}`)
    .get();
  return row?.c ?? 0;
}

describe("buildIndex", () => {
  test("full build indexes every session and message from every adapter", async () => {
    const db = freshDb();
    const adapter = new FakeAdapter([
      makeSession({ id: "s1" }),
      makeSession({ id: "s2", filePath: "/fake/s2.jsonl" }),
    ]);

    const stats = await buildIndex(db, [adapter]);

    expect(stats).toEqual({
      sessionsIndexed: 2,
      sessionsUnchanged: 0,
      sessionsPruned: 0,
    });
    expect(countRows(db, "sessions")).toBe(2);
    expect(countRows(db, "messages_fts")).toBe(4);
  });

  test("a second run with no changed files re-indexes nothing", async () => {
    const db = freshDb();
    const adapter = new FakeAdapter([makeSession({ id: "s1" })]);
    await buildIndex(db, [adapter]);

    const stats = await buildIndex(db, [adapter]);

    expect(stats).toEqual({
      sessionsIndexed: 0,
      sessionsUnchanged: 1,
      sessionsPruned: 0,
    });
  });

  test("only the session whose mtime changed is re-indexed", async () => {
    const db = freshDb();
    const s1 = makeSession({ id: "s1" });
    const s2 = makeSession({ id: "s2", filePath: "/fake/s2.jsonl" });
    const adapter = new FakeAdapter([s1, s2]);
    await buildIndex(db, [adapter]);

    adapter.sessions = [
      {
        ...s1,
        mtimeMs: 2000,
        messages: [
          {
            role: "user",
            content: "updated content",
            timestamp: "2026-01-02T00:00:00.000Z",
          },
        ],
      },
      s2,
    ];
    const stats = await buildIndex(db, [adapter]);

    expect(stats).toEqual({
      sessionsIndexed: 1,
      sessionsUnchanged: 1,
      sessionsPruned: 0,
    });
    const s1Messages = db
      .query<{ content: string }, [string]>(
        "SELECT content FROM messages_fts WHERE session_id = ?",
      )
      .all("s1");
    expect(s1Messages).toEqual([{ content: "updated content" }]);
  });

  test("prunes sessions and messages for source files that no longer exist", async () => {
    const db = freshDb();
    const s1 = makeSession({ id: "s1" });
    const s2 = makeSession({ id: "s2", filePath: "/fake/s2.jsonl" });
    const adapter = new FakeAdapter([s1, s2]);
    await buildIndex(db, [adapter]);

    adapter.sessions = [s1];
    const stats = await buildIndex(db, [adapter]);

    expect(stats).toEqual({
      sessionsIndexed: 0,
      sessionsUnchanged: 1,
      sessionsPruned: 1,
    });
    expect(
      db.query<{ id: string }, []>("SELECT id FROM sessions").all(),
    ).toEqual([{ id: "s1" }]);
    expect(countRows(db, "messages_fts")).toBe(2);
  });

  test("indexes sessions from multiple registered adapters independently", async () => {
    const db = freshDb();
    const adapterA = new FakeAdapter(
      [makeSession({ id: "s1", source: "adapter-a" })],
      "adapter-a",
    );
    const adapterB = new FakeAdapter(
      [
        makeSession({
          id: "s1",
          source: "adapter-b",
          filePath: "/fake/other/s1.jsonl",
        }),
      ],
      "adapter-b",
    );

    const stats = await buildIndex(db, [adapterA, adapterB]);

    expect(stats).toEqual({
      sessionsIndexed: 2,
      sessionsUnchanged: 0,
      sessionsPruned: 0,
    });
    expect(countRows(db, "sessions")).toBe(2);
  });
});
