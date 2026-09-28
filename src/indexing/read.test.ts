import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import type { Session } from "../adapters/types";
import { buildIndex } from "./build";
import { loadSession } from "./read";
import { ensureSchema } from "./schema";

function sessionWith(messageCount: number): Session {
  return {
    id: "s1",
    source: "fake",
    projectPath: "/Users/test/my-project",
    filePath: "/fake/s1.jsonl",
    mtimeMs: 1000,
    messages: Array.from({ length: messageCount }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `message ${index}`,
      timestamp: `2026-01-01T00:00:${String(index).padStart(2, "0")}.000Z`,
    })),
  };
}

async function indexed(session: Session): Promise<Database> {
  const db = new Database(":memory:");
  ensureSchema(db);
  await buildIndex(db, [
    { id: session.source, discover: async () => [session] },
  ]);
  return db;
}

describe("loadSession", () => {
  test("returns the session's metadata and every message", async () => {
    const db = await indexed(sessionWith(2));

    const loaded = loadSession(db, "fake", "s1");

    expect(loaded).toEqual({
      source: "fake",
      id: "s1",
      projectPath: "/Users/test/my-project",
      filePath: "/fake/s1.jsonl",
      mtimeMs: 1000,
      messages: [
        {
          role: "user",
          content: "message 0",
          timestamp: "2026-01-01T00:00:00.000Z",
          seq: 0,
        },
        {
          role: "assistant",
          content: "message 1",
          timestamp: "2026-01-01T00:00:01.000Z",
          seq: 1,
        },
      ],
    });

    db.close();
  });

  test("orders messages numerically, not lexicographically", async () => {
    const db = await indexed(sessionWith(12));

    const seqs = loadSession(db, "fake", "s1")?.messages.map((m) => m.seq);

    expect(seqs).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

    db.close();
  });

  test("returns null for a session that isn't indexed", async () => {
    const db = await indexed(sessionWith(1));

    expect(loadSession(db, "fake", "missing")).toBeNull();
    expect(loadSession(db, "other", "s1")).toBeNull();

    db.close();
  });
});
