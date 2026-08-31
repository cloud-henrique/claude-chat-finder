import { describe, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { openIndexDb } from "./db";

describe("openIndexDb", () => {
  test("creates the database file, parent directories, and schema on a fresh path", async () => {
    const dir = join(import.meta.dir, "__tmp__", `db-test-${Date.now()}`);
    const dbPath = join(dir, "nested", "index.sqlite");

    try {
      const db = await openIndexDb(dbPath);
      expect(await Bun.file(dbPath).exists()).toBe(true);

      const row = db
        .query<{ c: number }, [string]>(
          "SELECT count(*) as c FROM sqlite_master WHERE name = ?",
        )
        .get("sessions");
      expect(row?.c).toBe(1);

      db.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
