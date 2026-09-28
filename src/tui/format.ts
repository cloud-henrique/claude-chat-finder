import { homedir } from "node:os";

/** Replaces the home-directory prefix with `~` for compact display. */
export function shortenHome(path: string, home: string = homedir()): string {
  if (home.length === 0) return path;
  const normalizedHome = home.replace(/[/\\]+$/, "");
  if (path === normalizedHome) return "~";
  const separator = path[normalizedHome.length];
  if (
    path.startsWith(normalizedHome) &&
    (separator === "/" || separator === "\\")
  ) {
    return `~${path.slice(normalizedHome.length)}`;
  }
  return path;
}

/** Formats an ISO timestamp as `YYYY-MM-DD`, or "" when it isn't parseable. */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/**
 * Formats an ISO timestamp as a local `YYYY-MM-DD HH:MM`, or "" when it isn't
 * parseable. Local time on purpose: these are the user's own chats, and the
 * time they remember is the one their clock showed.
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
