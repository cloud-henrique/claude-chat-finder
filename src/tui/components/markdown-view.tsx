import { Text } from "ink";
import type { MarkdownLine } from "../markdown";

interface KeyedLine {
  key: string;
  spans: { key: string; span: MarkdownLine[number] }[];
}

/**
 * Renders pre-wrapped Markdown lines as styled Ink text, one line each.
 *
 * Keys are precomputed outside the JSX: a display line has no identity beyond
 * its position, and the whole list is re-derived whenever anything changes.
 */
export function MarkdownView({ lines }: { lines: MarkdownLine[] }) {
  const keyed: KeyedLine[] = lines.map((spans, lineIndex) => ({
    key: String(lineIndex),
    spans: spans.map((span, spanIndex) => ({
      key: `${lineIndex}:${spanIndex}`,
      span,
    })),
  }));

  return (
    <>
      {keyed.map((line) => (
        <Text key={line.key} wrap="truncate">
          {line.spans.length === 0
            ? " "
            : line.spans.map(({ key, span }) => (
                <Text
                  key={key}
                  bold={span.bold}
                  italic={span.italic}
                  dimColor={span.dim}
                  color={span.color}
                >
                  {span.text}
                </Text>
              ))}
        </Text>
      ))}
    </>
  );
}
