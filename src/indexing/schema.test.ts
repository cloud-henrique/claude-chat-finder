import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { ensureSchema } from "./schema";

function tableExists(db: Database, name: string): boolean {
  const row = db
    .query<{ c: number }, [string]>(
      "SELECT count(*) as c FROM sqlite_master WHERE name = ?",
    )
    .get(name);
  return (row?.c ?? 0) > 0;
}

describe("ensureSchema", () => {
  test("creates the sessions table and the messages_fts virtual table", () => {
    const db = new Database(":memory:");
    ensureSchema(db);

    expect(tableExists(db, "sessions")).toBe(true);
    expect(tableExists(db, "messages_fts")).toBe(true);
  });

  test("is idempotent on an already-initialized database", () => {
    const db = new Database(":memory:");
    ensureSchema(db);
    expect(() => ensureSchema(db)).not.toThrow();
  });
});
