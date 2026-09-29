import { describe, expect, test } from "bun:test";
import type { IndexedSession } from "../indexing/read";
import { toTranscriptMarkdown } from "./transcript";

function session(messages: IndexedSession["messages"]): IndexedSession {
  return {
    source: "claude-code",
    id: "s1",
    projectPath: "/Users/test/app",
    filePath: "/Users/test/.claude/projects/-Users-test-app/s1.jsonl",
    mtimeMs: 1,
    messages,
  };
}

describe("toTranscriptMarkdown", () => {
  test("prefixes every message with a role heading", () => {
    const markdown = toTranscriptMarkdown(
      session([
        {
          role: "user",
          content: "hello",
          timestamp: "2026-01-01T00:00:00.000Z",
          seq: 0,
        },
        {
          role: "assistant",
          content: "hi",
          timestamp: "2026-01-01T00:00:01.000Z",
          seq: 1,
        },
      ]),
    );

    const lines = markdown.split("\n");

    expect(lines[0]).toMatch(/^## user · \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe("hello");
    expect(lines[3]).toBe("");
    expect(lines[4]).toMatch(/^## assistant · \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(lines[6]).toBe("hi");
  });

  test("keeps code fences in the message body intact", () => {
    const markdown = toTranscriptMarkdown(
      session([
        {
          role: "assistant",
          content: "```ts\nconst x = 1;\n```",
          timestamp: "2026-01-01T00:00:00.000Z",
          seq: 0,
        },
      ]),
    );

    expect(markdown).toContain("```ts\nconst x = 1;\n```");
  });

  test("skips messages whose text content is empty", () => {
    const markdown = toTranscriptMarkdown(
      session([
        {
          role: "user",
          content: "kept",
          timestamp: "2026-01-01T00:00:00.000Z",
          seq: 0,
        },
        {
          role: "assistant",
          content: "   ",
          timestamp: "2026-01-01T00:00:01.000Z",
          seq: 1,
        },
      ]),
    );

    expect(markdown).toContain("kept");
    expect(markdown.match(/^## /gm)).toHaveLength(1);
  });

  test("renders an empty session as an empty transcript", () => {
    expect(toTranscriptMarkdown(session([]))).toBe("");
  });
});
