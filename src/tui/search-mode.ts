import type { SearchOptions } from "../search/search";

/** The three mutually exclusive matching modes, cycled with Tab. */
export type SearchMode = "text" | "word" | "regex";

const ORDER: SearchMode[] = ["text", "word", "regex"];

export const MODE_LABELS: Record<SearchMode, string> = {
  text: "text",
  word: "word",
  regex: "regex",
};

export function nextMode(mode: SearchMode): SearchMode {
  const index = ORDER.indexOf(mode);
  return ORDER[(index + 1) % ORDER.length] ?? "text";
}

/** Maps the TUI's mode + case flag onto the search capability's options. */
export function toSearchOptions(
  mode: SearchMode,
  caseSensitive: boolean,
): SearchOptions {
  return {
    caseSensitive,
    wholeWord: mode === "word",
    regex: mode === "regex",
  };
}
