import { Box, Text } from "ink";
import type { IndexedSession } from "../../indexing/read";
import { formatDate, shortenHome } from "../format";
import { renderMarkdown } from "../markdown";
import { toTranscriptMarkdown } from "../transcript";
import { clampScroll } from "../viewport";
import { MarkdownView } from "./markdown-view";

interface PreviewPaneProps {
  session: IndexedSession | null;
  scroll: number;
  width: number;
  height: number;
}

/** Renders the selected session's transcript as Markdown, scrolled by line. */
export function PreviewPane({
  session,
  scroll,
  width,
  height,
}: PreviewPaneProps) {
  if (!session) {
    return (
      <Box width={width} flexDirection="column">
        <Text dimColor>No session selected.</Text>
      </Box>
    );
  }

  const contentHeight = Math.max(1, height - 1);
  const lines = renderMarkdown(toTranscriptMarkdown(session), width);
  const offset = clampScroll(scroll, lines.length, contentHeight);
  const visible = lines.slice(offset, offset + contentHeight);
  const started = formatDate(session.messages[0]?.timestamp ?? "");
  const position =
    lines.length > contentHeight
      ? ` ${offset + 1}-${offset + visible.length}/${lines.length}`
      : "";

  return (
    <Box width={width} flexDirection="column">
      <Box>
        <Box flexGrow={1}>
          <Text wrap="truncate-start" bold>
            {shortenHome(session.projectPath)}
          </Text>
        </Box>
        <Box flexShrink={0}>
          <Text dimColor>{` ${started}${position}`}</Text>
        </Box>
      </Box>
      <MarkdownView lines={visible} />
    </Box>
  );
}
