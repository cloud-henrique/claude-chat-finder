import { describe, expect, test } from "bun:test";
import type { IndexedSession } from "../indexing/read";
import {
  toExportJson,
  toExportMarkdown,
  toNormalizedSession,
} from "./serialize";

function session(messages: IndexedSession["messages"] = []): IndexedSession {
  return {
    source: "claude-code",
    id: "11111111-1111-1111-1111-111111111111",
    projectPath: "/Users/test/app",
    filePath: "/Users/test/.claude/projects/-Users-test-app/s1.jsonl",
    mtimeMs: 1727500000000,
    messages,
  };
}

const HELLO: IndexedSession["messages"][number] = {
  role: "user",
  content: "hello",
  timestamp: "2026-01-01T10:30:00.000Z",
  seq: 0,
};

describe("toExportMarkdown", () => {
  test("opens with a header identifying the chat", () => {
    const lines = toExportMarkdown(session([HELLO])).split("\n");

    expect(lines.slice(0, 6)).toEqual([
      "# Chat transcript",
      "",
      "- Project: /Users/test/app",
      "- Session: 11111111-1111-1111-1111-111111111111",
      "- Source: claude-code",
      "- File: /Users/test/.claude/projects/-Users-test-app/s1.jsonl",
    ]);
  });

  test("writes one section per message with a UTC timestamp", () => {
    const markdown = toExportMarkdown(
      session([
        HELLO,
        {
          role: "assistant",
          content: "hi there",
          timestamp: "2026-01-01T10:30:05.000Z",
          seq: 1,
        },
      ]),
    );

    expect(markdown).toContain("## user · 2026-01-01T10:30:00.000Z\n\nhello");
    expect(markdown).toContain(
      "## assistant · 2026-01-01T10:30:05.000Z\n\nhi there",
    );
  });

  test("normalizes an offset timestamp to UTC", () => {
    const markdown = toExportMarkdown(
      session([{ ...HELLO, timestamp: "2026-01-01T10:30:00+02:00" }]),
    );

    expect(markdown).toContain("## user · 2026-01-01T08:30:00.000Z");
  });

  test("passes an unparseable timestamp through untouched", () => {
    const markdown = toExportMarkdown(
      session([{ ...HELLO, timestamp: "not a date" }]),
    );

    expect(markdown).toContain("## user · not a date");
  });

  test("keeps code fences in the message body intact", () => {
    const markdown = toExportMarkdown(
      session([{ ...HELLO, content: "```ts\nconst x = 1;\n```" }]),
    );

    expect(markdown).toContain("```ts\nconst x = 1;\n```");
  });

  test("skips messages whose text content is empty", () => {
    const markdown = toExportMarkdown(
      session([HELLO, { ...HELLO, content: "   ", seq: 1 }]),
    );

    expect(markdown.match(/^## /gm)).toHaveLength(1);
  });

  test("still exports the header for a session with no text", () => {
    const markdown = toExportMarkdown(session());

    expect(markdown).toContain("# Chat transcript");
    expect(markdown).not.toContain("## ");
    expect(markdown.endsWith("\n")).toBe(true);
  });
});

describe("toExportJson", () => {
  test("produces valid JSON matching the normalized session", () => {
    const parsed = JSON.parse(toExportJson(session([HELLO])));

    expect(parsed).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      source: "claude-code",
      projectPath: "/Users/test/app",
      filePath: "/Users/test/.claude/projects/-Users-test-app/s1.jsonl",
      mtimeMs: 1727500000000,
      messages: [
        {
          role: "user",
          content: "hello",
          timestamp: "2026-01-01T10:30:00.000Z",
        },
      ],
    });
  });

  test("drops the index-only seq column", () => {
    expect(toExportJson(session([HELLO]))).not.toContain("seq");
  });

  test("keeps messages the transcript would skip", () => {
    const parsed = JSON.parse(
      toExportJson(session([HELLO, { ...HELLO, content: "", seq: 1 }])),
    );

    expect(parsed.messages).toHaveLength(2);
  });

  test("preserves message order", () => {
    const parsed = JSON.parse(
      toExportJson(
        session([
          { ...HELLO, content: "first" },
          { ...HELLO, content: "second", seq: 1 },
          { ...HELLO, content: "third", seq: 2 },
        ]),
      ),
    );

    expect(parsed.messages.map((m: { content: string }) => m.content)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  test("is indented for reading", () => {
    expect(toExportJson(session([HELLO])).split("\n")[1]).toBe(
      '  "id": "11111111-1111-1111-1111-111111111111",',
    );
  });
});

describe("toNormalizedSession", () => {
  test("keeps every field of the adapter's Session model", () => {
    expect(Object.keys(toNormalizedSession(session([HELLO])))).toEqual([
      "id",
      "source",
      "projectPath",
      "filePath",
      "mtimeMs",
      "messages",
    ]);
  });
});
