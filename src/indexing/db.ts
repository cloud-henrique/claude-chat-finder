import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { resolveIndexDbPath } from "./paths";
import { ensureSchema } from "./schema";

/** Opens (creating if needed) the local index database at `dbPath`. */
export async function openIndexDb(
  dbPath: string = resolveIndexDbPath(),
): Promise<Database> {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  ensureSchema(db);
  return db;
}
