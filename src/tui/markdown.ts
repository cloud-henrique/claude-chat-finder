/**
 * A deliberately small Markdown-to-terminal renderer.
 *
 * It covers only what a chat transcript actually contains — headings, fenced
 * code blocks, lists, blockquotes, rules and inline emphasis/code — and emits
 * plain data (styled spans per display line) rather than React elements. That
 * keeps it a pure, precisely testable function, and lets the preview pane
 * slice the output by line to scroll without re-rendering everything.
 *
 * Hand-rolled instead of pulling in a Markdown library for the same reason
 * `src/indexing/paths.ts` is: the subset that matters here is tiny, and the
 * exact per-line output is what the tests need to assert.
 */

export interface MarkdownSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  dim?: boolean;
  color?: string;
}

/** One display line, already wrapped to the requested width. */
export type MarkdownLine = MarkdownSpan[];

const HEADING_COLOR = "cyan";
const CODE_COLOR = "yellow";
const GUTTER_COLOR = "gray";

const FENCE = /^\s{0,3}(`{3,}|~{3,})(.*)$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const RULE = /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;
const BLOCKQUOTE = /^\s{0,3}>\s?(.*)$/;
const BULLET = /^(\s*)[-*+]\s+(.*)$/;
const ORDERED = /^(\s*)(\d+)[.)]\s+(.*)$/;

const INLINE =
  /(`+)([\s\S]*?)\1|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\*([^*\n]+?)\*|_([^_\n]+?)_/g;

/** Renders Markdown source into styled lines wrapped to `width` columns. */
export function renderMarkdown(source: string, width: number): MarkdownLine[] {
  const columns = Math.max(1, Math.floor(width));
  const lines: MarkdownLine[] = [];
  const sourceLines = source.replace(/\r\n?/g, "\n").split("\n");

  let fence: string | null = null;

  for (const line of sourceLines) {
    const fenceMatch = line.match(FENCE);

    if (fence) {
      if (closesFence(fenceMatch?.[1], fence)) {
        fence = null;
        continue;
      }
      lines.push(...renderCodeLine(line, columns));
      continue;
    }

    if (fenceMatch?.[1]) {
      fence = fenceMatch[1];
      const language = (fenceMatch[2] ?? "").trim();
      if (language) {
        lines.push([
          { text: gutter(), dim: true, color: GUTTER_COLOR },
          { text: language, dim: true },
        ]);
      }
      continue;
    }

    lines.push(...renderTextLine(line, columns));
  }

  return lines;
}

/** A fence closes only with the same character, repeated at least as often. */
function closesFence(candidate: string | undefined, open: string): boolean {
  if (!candidate) return false;
  return candidate[0] === open[0] && candidate.length >= open.length;
}

function renderCodeLine(line: string, columns: number): MarkdownLine[] {
  const available = Math.max(1, columns - gutter().length);
  const chunks = hardWrap(line.replace(/\t/g, "  "), available);
  return chunks.map((chunk) => [
    { text: gutter(), dim: true, color: GUTTER_COLOR },
    { text: chunk, color: CODE_COLOR },
  ]);
}

function renderTextLine(line: string, columns: number): MarkdownLine[] {
  if (line.trim() === "") return [[]];

  if (RULE.test(line)) {
    return [[{ text: "─".repeat(columns), dim: true }]];
  }

  const heading = line.match(HEADING);
  if (heading) {
    const spans = parseInline(heading[2] ?? "").map((span) => ({
      ...span,
      bold: true,
      color: span.color ?? HEADING_COLOR,
    }));
    return wrapSpans(spans, columns, "", "");
  }

  const quote = line.match(BLOCKQUOTE);
  if (quote) {
    const spans = parseInline(quote[1] ?? "").map((span) => ({
      ...span,
      dim: true,
    }));
    return wrapSpans(spans, columns, gutter(), gutter());
  }

  const ordered = line.match(ORDERED);
  if (ordered) {
    const indent = ordered[1] ?? "";
    const marker = `${indent}${ordered[2]}. `;
    return wrapSpans(
      parseInline(ordered[3] ?? ""),
      columns,
      marker,
      " ".repeat(marker.length),
    );
  }

  const bullet = line.match(BULLET);
  if (bullet) {
    const indent = bullet[1] ?? "";
    const marker = `${indent}• `;
    return wrapSpans(
      parseInline(bullet[2] ?? ""),
      columns,
      marker,
      " ".repeat(marker.length),
    );
  }

  return wrapSpans(parseInline(line), columns, "", "");
}

/** Splits a line into styled spans, resolving inline code and emphasis. */
export function parseInline(text: string): MarkdownSpan[] {
  const spans: MarkdownSpan[] = [];
  let lastIndex = 0;

  INLINE.lastIndex = 0;
  let match = INLINE.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, match.index) });
    }

    const [, , code, boldStar, boldUnderscore, italicStar, italicUnderscore] =
      match;

    if (code !== undefined) {
      spans.push({ text: code.trim(), color: CODE_COLOR });
    } else if (boldStar !== undefined || boldUnderscore !== undefined) {
      spans.push({ text: boldStar ?? boldUnderscore ?? "", bold: true });
    } else {
      spans.push({
        text: italicStar ?? italicUnderscore ?? "",
        italic: true,
      });
    }

    lastIndex = match.index + match[0].length;
    match = INLINE.exec(text);
  }

  if (lastIndex < text.length) {
    spans.push({ text: text.slice(lastIndex) });
  }

  return spans.filter((span) => span.text.length > 0);
}

/**
 * Greedy word-wraps a span sequence, prefixing the first output line with
 * `firstPrefix` and every continuation line with `nextPrefix`.
 */
function wrapSpans(
  spans: MarkdownSpan[],
  columns: number,
  firstPrefix: string,
  nextPrefix: string,
): MarkdownLine[] {
  const lines: MarkdownLine[] = [];
  let current: MarkdownLine = [];
  let used = 0;
  let prefix = firstPrefix;

  const flush = () => {
    // Trailing whitespace would push the line past `columns` and make the
    // wrap look ragged, so it never survives a line break.
    while (current.at(-1)?.text.trim() === "") current.pop();
    lines.push(prefix ? [{ text: prefix, dim: true }, ...current] : current);
    current = [];
    used = 0;
    prefix = nextPrefix;
  };

  for (const span of spans) {
    for (const word of splitWords(span.text)) {
      const available = Math.max(1, columns - prefix.length);
      const isSpace = word.trim() === "";

      if (isSpace) {
        if (used > 0) {
          current.push({ ...span, text: word });
          used += word.length;
        }
        continue;
      }

      for (const chunk of hardWrap(word, available)) {
        if (used > 0 && used + chunk.length > available) flush();
        current.push({ ...span, text: chunk });
        used += chunk.length;
      }
    }
  }

  flush();
  return lines;
}

/** Splits text into alternating word/whitespace runs. */
function splitWords(text: string): string[] {
  return text.match(/\s+|\S+/g) ?? [];
}

/** Breaks a single unbreakable run (a URL, a path) into width-sized chunks. */
function hardWrap(text: string, width: number): string[] {
  if (text.length <= width) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += width) {
    chunks.push(text.slice(i, i + width));
  }
  return chunks;
}

function gutter(): string {
  return "│ ";
}
