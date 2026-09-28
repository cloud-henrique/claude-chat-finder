import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import type { ChatAdapter, Session } from "../adapters/types";
import { buildIndex } from "../indexing/build";
import { ensureSchema } from "../indexing/schema";
import { InvalidRegexError, searchSessions } from "./search";

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "s1",
    source: "fake",
    projectPath: "/Users/test/project",
    filePath: "/fake/s1.jsonl",
    mtimeMs: 1000,
    messages: [],
    ...overrides,
  };
}

class FakeAdapter implements ChatAdapter {
  readonly id = "fake";
  constructor(private sessions: Session[]) {}
  async discover(): Promise<Session[]> {
    return this.sessions;
  }
}

async function seededDb(sessions: Session[]): Promise<Database> {
  const db = new Database(":memory:");
  ensureSchema(db);
  await buildIndex(db, [new FakeAdapter(sessions)]);
  return db;
}

describe("searchSessions", () => {
  test("returns the session containing a matching term, with the matching message", async () => {
    const db = await seededDb([
      makeSession({
        id: "s1",
        messages: [
          {
            role: "user",
            content: "there is a bug in the parser",
            timestamp: "t1",
          },
        ],
      }),
      makeSession({
        id: "s2",
        filePath: "/fake/s2.jsonl",
        messages: [
          { role: "user", content: "unrelated content", timestamp: "t1" },
        ],
      }),
    ]);

    const results = searchSessions(db, "bug");

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("s1");
    expect(results[0]?.matches).toEqual([
      {
        role: "user",
        content: "there is a bug in the parser",
        timestamp: "t1",
        seq: 0,
      },
    ]);
  });

  test("empty query returns no results", async () => {
    const db = await seededDb([makeSession({ messages: [] })]);
    expect(searchSessions(db, "   ")).toEqual([]);
  });

  test("ranks a session where the term is denser higher than one where it's diluted", async () => {
    const db = await seededDb([
      makeSession({
        id: "long",
        filePath: "/fake/long.jsonl",
        messages: [
          {
            role: "user",
            content:
              "hello there general kenobi how are you doing today my friend",
            timestamp: "t1",
          },
        ],
      }),
      makeSession({
        id: "short",
        filePath: "/fake/short.jsonl",
        messages: [{ role: "user", content: "kenobi", timestamp: "t1" }],
      }),
    ]);

    const results = searchSessions(db, "kenobi");

    expect(results.map((r) => r.id)).toEqual(["short", "long"]);
  });

  describe("case sensitivity", () => {
    test("case-insensitive (default) matches regardless of casing", async () => {
      const db = await seededDb([
        makeSession({
          messages: [{ role: "user", content: "found a bug", timestamp: "t1" }],
        }),
      ]);

      expect(searchSessions(db, "Bug")).toHaveLength(1);
    });

    test("case-sensitive mode excludes a differently-cased match", async () => {
      const db = await seededDb([
        makeSession({
          messages: [{ role: "user", content: "found a bug", timestamp: "t1" }],
        }),
      ]);

      const results = searchSessions(db, "Bug", { caseSensitive: true });

      expect(results).toEqual([]);
    });

    test("case-sensitive mode still matches the exact casing", async () => {
      const db = await seededDb([
        makeSession({
          messages: [{ role: "user", content: "found a Bug", timestamp: "t1" }],
        }),
      ]);

      const results = searchSessions(db, "Bug", { caseSensitive: true });

      expect(results).toHaveLength(1);
    });
  });

  describe("whole-word mode", () => {
    test("substring mode (default) matches a prefix like 'login' for 'log'", async () => {
      const db = await seededDb([
        makeSession({
          messages: [
            { role: "user", content: "please login first", timestamp: "t1" },
          ],
        }),
      ]);

      expect(searchSessions(db, "log")).toHaveLength(1);
    });

    test("whole-word mode excludes 'login' and 'catalog' substring matches", async () => {
      const db = await seededDb([
        makeSession({
          id: "s1",
          messages: [
            { role: "user", content: "please login first", timestamp: "t1" },
          ],
        }),
        makeSession({
          id: "s2",
          filePath: "/fake/s2.jsonl",
          messages: [
            { role: "user", content: "see the catalog", timestamp: "t1" },
          ],
        }),
      ]);

      expect(searchSessions(db, "log", { wholeWord: true })).toEqual([]);
    });

    test("whole-word mode matches the standalone word 'log'", async () => {
      const db = await seededDb([
        makeSession({
          messages: [
            {
              role: "user",
              content: "check the log for errors",
              timestamp: "t1",
            },
          ],
        }),
      ]);

      const results = searchSessions(db, "log", { wholeWord: true });

      expect(results).toHaveLength(1);
    });
  });

  describe("regex mode", () => {
    test("a valid pattern returns matching sessions", async () => {
      const db = await seededDb([
        makeSession({
          id: "s1",
          messages: [
            {
              role: "user",
              content: "error code 404 returned",
              timestamp: "t1",
            },
          ],
        }),
        makeSession({
          id: "s2",
          filePath: "/fake/s2.jsonl",
          messages: [
            { role: "user", content: "no numbers here", timestamp: "t1" },
          ],
        }),
      ]);

      const results = searchSessions(db, "\\d{3}", { regex: true });

      expect(results.map((r) => r.id)).toEqual(["s1"]);
    });

    test("an invalid pattern throws a clean InvalidRegexError instead of crashing", async () => {
      const db = await seededDb([makeSession({ messages: [] })]);

      expect(() => searchSessions(db, "(unclosed", { regex: true })).toThrow(
        InvalidRegexError,
      );
    });
  });
});
