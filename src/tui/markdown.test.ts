import { describe, expect, test } from "bun:test";
import { type MarkdownLine, parseInline, renderMarkdown } from "./markdown";

function text(line: MarkdownLine | undefined): string {
  return (line ?? []).map((span) => span.text).join("");
}

function texts(lines: MarkdownLine[]): string[] {
  return lines.map(text);
}

describe("renderMarkdown", () => {
  test("renders a heading bold, without its hash markers", () => {
    const [line] = renderMarkdown("## Title", 40);

    expect(text(line)).toBe("Title");
    expect(line?.[0]?.bold).toBe(true);
  });

  test("keeps fenced code block content verbatim behind a gutter", () => {
    const lines = renderMarkdown(
      ["```ts", "const x = 1;", "if (x) {", "}", "```"].join("\n"),
      40,
    );

    expect(texts(lines)).toEqual([
      "│ ts",
      "│ const x = 1;",
      "│ if (x) {",
      "│ }",
    ]);
  });

  test("does not interpret Markdown syntax inside a code block", () => {
    const lines = renderMarkdown(
      ["```", "# not a heading", "- not a bullet", "```"].join("\n"),
      40,
    );

    expect(texts(lines)).toEqual(["│ # not a heading", "│ - not a bullet"]);
  });

  test("closes a code block only on a matching fence", () => {
    const lines = renderMarkdown(
      ["~~~", "still code ```", "~~~", "# heading"].join("\n"),
      40,
    );

    expect(texts(lines)).toEqual(["│ still code ```", "heading"]);
  });

  test("renders list items with a bullet and hanging indentation", () => {
    const lines = renderMarkdown("- alpha beta gamma delta", 12);

    expect(texts(lines)).toEqual(["• alpha beta", "  gamma", "  delta"]);
  });

  test("renders ordered list items keeping their number", () => {
    expect(texts(renderMarkdown("1. first", 40))).toEqual(["1. first"]);
  });

  test("word-wraps a paragraph to the requested width", () => {
    const lines = renderMarkdown("one two three four five", 10);

    for (const line of texts(lines)) {
      expect(line.length).toBeLessThanOrEqual(10);
    }
    expect(texts(lines).join(" ").replace(/\s+/g, " ").trim()).toBe(
      "one two three four five",
    );
  });

  test("hard-wraps a single run longer than the width", () => {
    const lines = renderMarkdown("/a/very/long/unbreakable/path", 10);

    expect(texts(lines)).toEqual(["/a/very/lo", "ng/unbreak", "able/path"]);
  });

  test("renders a horizontal rule at the full width", () => {
    expect(texts(renderMarkdown("---", 5))).toEqual(["─────"]);
  });

  test("keeps blank lines as blank display lines", () => {
    expect(renderMarkdown("a\n\nb", 20)).toEqual([
      [{ text: "a" }],
      [],
      [{ text: "b" }],
    ]);
  });

  test("dims blockquotes behind a gutter", () => {
    const [line] = renderMarkdown("> quoted", 40);

    expect(text(line)).toBe("│ quoted");
    expect(line?.at(-1)?.dim).toBe(true);
  });

  test("never emits a line wider than the requested width", () => {
    const source = [
      "# A fairly long heading that needs wrapping for sure",
      "",
      "- a bullet item with enough words to wrap twice over",
      "```",
      "an extremely long line of code that will not fit at all",
      "```",
    ].join("\n");

    for (const line of texts(renderMarkdown(source, 24))) {
      expect(line.length).toBeLessThanOrEqual(24);
    }
  });
});

describe("parseInline", () => {
  test("styles bold, italic, and inline code", () => {
    expect(parseInline("a **b** c *d* e `f`")).toEqual([
      { text: "a " },
      { text: "b", bold: true },
      { text: " c " },
      { text: "d", italic: true },
      { text: " e " },
      { text: "f", color: "yellow" },
    ]);
  });

  test("leaves plain text as a single span", () => {
    expect(parseInline("just text")).toEqual([{ text: "just text" }]);
  });

  test("treats underscores as emphasis too", () => {
    expect(parseInline("__b__ _i_")).toEqual([
      { text: "b", bold: true },
      { text: " " },
      { text: "i", italic: true },
    ]);
  });
});
