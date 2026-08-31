import { describe, expect, spyOn, test } from "bun:test";
import { join } from "node:path";
import { ClaudeCodeAdapter } from "./index";

const FIXTURES_ROOT = join(import.meta.dir, "__fixtures__");

describe("ClaudeCodeAdapter", () => {
  test("parses a valid session fixture into the normalized model", async () => {
    const adapter = new ClaudeCodeAdapter();
    const sessions = await adapter.discover(FIXTURES_ROOT);

    const session = sessions.find(
      (s) => s.id === "11111111-1111-1111-1111-111111111111",
    );
    expect(session).toBeDefined();
    expect(session?.source).toBe("claude-code");
    expect(session?.projectPath).toBe("/Users/test/my-app");
    expect(session?.messages).toEqual([
      {
        role: "user",
        content: "Hello, can you help me fix a bug?",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
      {
        role: "assistant",
        content: "Sure, let's look at the code.",
        timestamp: "2026-01-01T00:00:05.000Z",
      },
    ]);
  });

  test("resolves the project path from cwd, not the sanitized folder name", async () => {
    const adapter = new ClaudeCodeAdapter();
    const sessions = await adapter.discover(FIXTURES_ROOT);

    const session = sessions.find(
      (s) => s.id === "22222222-2222-2222-2222-222222222222",
    );
    expect(session?.projectPath).toBe("/Users/foo-bar/baz");
    // The fixture lives in a folder named "-Users-foo-bar-baz", which could also
    // be a naive (wrong) decode of "/Users/foo/bar/baz". Guard against ever
    // falling back to decoding the folder name instead of reading `cwd`.
    expect(session?.projectPath).not.toBe("/Users/foo/bar/baz");
  });

  test("skips a corrupt session file, warns, and keeps indexing the rest", async () => {
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
    try {
      const adapter = new ClaudeCodeAdapter();
      const sessions = await adapter.discover(FIXTURES_ROOT);

      expect(
        sessions.some((s) => s.id === "33333333-3333-3333-3333-333333333333"),
      ).toBe(false);
      expect(
        sessions.some((s) => s.id === "11111111-1111-1111-1111-111111111111"),
      ).toBe(true);
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  test("returns an empty array when the root directory does not exist", async () => {
    const adapter = new ClaudeCodeAdapter();
    const sessions = await adapter.discover(
      join(FIXTURES_ROOT, "does-not-exist"),
    );
    expect(sessions).toEqual([]);
  });
});
