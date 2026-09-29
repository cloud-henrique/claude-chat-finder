import type { Session } from "../adapters/types";
import type { IndexedSession } from "../indexing/read";

/**
 * Turns an indexed session into the two shapes a user can take out of the
 * tool: a Markdown document and the normalized session as JSON.
 *
 * This is deliberately not `tui/transcript.ts`. That one is display-shaped —
 * it exists to fill a preview pane, so it has no header and prints local
 * `YYYY-MM-DD HH:MM` times, which lose the offset the moment the text leaves
 * this machine. An exported chat is read somewhere else, by someone who needs
 * to know which project and which file it came from, so it carries a header
 * and absolute UTC timestamps.
 */

/**
 * The normalized model from `adapters/types.ts`, which is what the export is
 * specified to produce. `seq` is dropped on the way out: it exists because
 * FTS5 has no inherent row order, not because a chat has a column of message
 * numbers — the array order already carries that.
 */
export function toNormalizedSession(session: IndexedSession): Session {
  return {
    id: session.id,
    source: session.source,
    projectPath: session.projectPath,
    filePath: session.filePath,
    mtimeMs: session.mtimeMs,
    messages: session.messages.map(({ role, content, timestamp }) => ({
      role,
      content,
      timestamp,
    })),
  };
}

/**
 * A self-contained Markdown document: a header identifying the chat, then one
 * section per message. Messages with no text at all — a turn that was nothing
 * but tool calls, which the adapter does not index — are skipped, exactly as
 * the preview skips them.
 */
export function toExportMarkdown(session: IndexedSession): string {
  const header = [
    "# Chat transcript",
    "",
    `- Project: ${session.projectPath}`,
    `- Session: ${session.id}`,
    `- Source: ${session.source}`,
    `- File: ${session.filePath}`,
  ].join("\n");

  const body = session.messages
    .filter((message) => message.content.trim().length > 0)
    .map(
      (message) =>
        `## ${message.role} · ${toIsoTimestamp(message.timestamp)}\n\n${message.content}`,
    )
    .join("\n\n");

  return body.length > 0 ? `${header}\n\n${body}\n` : `${header}\n`;
}

/** The normalized session as pretty-printed JSON. */
export function toExportJson(session: IndexedSession): string {
  return `${JSON.stringify(toNormalizedSession(session), null, 2)}\n`;
}

/**
 * Normalizes a timestamp to UTC ISO 8601. Anything unparseable is passed
 * through untouched rather than dropped — a transcript is a record, and a
 * timestamp we can't read is still what the source file said.
 */
function toIsoTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toISOString();
}
