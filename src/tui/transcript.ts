import type { IndexedSession } from "../indexing/read";
import { formatTimestamp } from "./format";

/**
 * Flattens an indexed session into the Markdown shown in the preview pane:
 * a heading per message, then the message body as it was written.
 *
 * Only text content is indexed (tool calls and thinking blocks are dropped by
 * the adapter), so a transcript is already plain Markdown. Messages left with
 * no text at all — a turn that was nothing but tool calls — are skipped
 * entirely rather than rendered as an empty heading.
 */
export function toTranscriptMarkdown(session: IndexedSession): string {
  return session.messages
    .filter((message) => message.content.trim().length > 0)
    .map(
      (message) =>
        `## ${message.role} · ${formatTimestamp(message.timestamp)}\n\n${message.content}`,
    )
    .join("\n\n");
}
