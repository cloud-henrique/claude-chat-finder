import type { Database } from "bun:sqlite";
import { Buffer } from "node:buffer";
import { Box, Text, useApp, useInput, useWindowSize } from "ink";
import { useEffect, useMemo, useState } from "react";
import { copyToClipboard, revealInFileManager } from "../export/run";
import { toExportJson, toExportMarkdown } from "../export/serialize";
import type { IndexStats } from "../indexing/build";
import { type IndexedSession, loadSession } from "../indexing/read";
import {
  InvalidRegexError,
  type SearchResult,
  searchSessions,
} from "../search/search";
import { PreviewPane } from "./components/preview-pane";
import { ResultList } from "./components/result-list";
import { SearchInput } from "./components/search-input";
import { footerHint } from "./footer";
import { formatSize } from "./format";
import { applyEdit, EMPTY_INPUT } from "./input-state";
import { nextMode, type SearchMode, toSearchOptions } from "./search-mode";
import { moveSelection } from "./viewport";

/**
 * Long enough to coalesce a fast typist's keystrokes into one query, short
 * enough to still feel instant. Search itself runs in single-digit
 * milliseconds, so this is about avoiding wasted renders, not latency.
 */
const SEARCH_DEBOUNCE_MS = 60;

/** How long an export confirmation stays in the header. */
const NOTICE_MS = 2500;

/**
 * Export actions are bound to Ctrl combinations because every printable key
 * goes into the query — that is what makes search-as-you-type work. `^J` looks
 * free but isn't usable: terminals send it as a line feed, which Ink reports
 * as Enter.
 */
const EXPORT_KEYS: Record<string, ExportAction> = {
  y: "markdown",
  r: "json",
  o: "reveal",
};

type ExportAction = "markdown" | "json" | "reveal";

/** A transient line in the header: the only feedback an export action gives. */
interface Notice {
  text: string;
  tone: "info" | "error";
}

/** Rows taken by the header, the query field and the footer. */
const CHROME_ROWS = 3;

/**
 * The results currently on screen, tagged with the query they belong to, so
 * the UI can tell "nothing matched" from "the debounced search hasn't run
 * yet" instead of flashing an empty state between keystrokes.
 */
interface SearchState {
  query: string;
  results: SearchResult[];
  error: string | null;
}

const NO_RESULTS: SearchState = { query: "", results: [], error: null };

type IndexState =
  | { status: "indexing" }
  | { status: "ready"; stats: IndexStats }
  | { status: "error"; message: string };

export interface AppProps {
  db: Database;
  /**
   * Refreshes the index. Injected rather than called directly so the app can
   * be mounted against a prebuilt test database.
   */
  runIndex: () => Promise<IndexStats>;
}

export function App({ db, runIndex }: AppProps) {
  const { exit } = useApp();
  const { columns, rows } = useWindowSize();

  const [index, setIndex] = useState<IndexState>({ status: "indexing" });
  const [input, setInput] = useState(EMPTY_INPUT);
  const [mode, setMode] = useState<SearchMode>("text");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [search, setSearch] = useState<SearchState>(NO_RESULTS);
  const [selected, setSelected] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);

  const bodyHeight = Math.max(1, rows - CHROME_ROWS);
  const listWidth = Math.min(Math.max(24, Math.floor(columns * 0.38)), 52);
  const previewWidth = Math.max(20, columns - listWidth - 2);

  // The index is built after the first paint, so the UI is usable (and says
  // what it's doing) instead of staring at a blank terminal for a second.
  useEffect(() => {
    let cancelled = false;
    runIndex()
      .then((stats) => {
        if (!cancelled) setIndex({ status: "ready", stats });
      })
      .catch((cause: unknown) => {
        if (!cancelled) setIndex({ status: "error", message: describe(cause) });
      });
    return () => {
      cancelled = true;
    };
  }, [runIndex]);

  // Every notice is a fresh object, so re-running the same action restarts
  // the countdown instead of inheriting the previous one.
  useEffect(() => {
    if (!notice) return;
    const handle = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(handle);
  }, [notice]);

  useEffect(() => {
    if (index.status !== "ready") return;

    if (input.value.trim() === "") {
      setSearch(NO_RESULTS);
      setSelected(0);
      setScroll(0);
      return;
    }

    const handle = setTimeout(() => {
      const query = input.value;
      try {
        setSearch({
          query,
          results: searchSessions(
            db,
            query,
            toSearchOptions(mode, caseSensitive),
          ),
          error: null,
        });
      } catch (cause) {
        // An invalid regex is expected user input while typing a pattern —
        // it must surface as a message, never as a crashed TUI.
        setSearch({
          query,
          results: [],
          error:
            cause instanceof InvalidRegexError
              ? cause.message
              : describe(cause),
        });
      }
      setSelected(0);
      setScroll(0);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [db, input.value, mode, caseSensitive, index.status]);

  const results = search.results;
  const isSearching = input.value.trim() !== "" && search.query !== input.value;

  const session = useMemo<IndexedSession | null>(() => {
    const result = results[selected];
    return result ? loadSession(db, result.source, result.id) : null;
  }, [db, results, selected]);

  async function runExport(action: ExportAction) {
    if (!session) {
      setNotice({ text: "select a chat first", tone: "error" });
      return;
    }

    try {
      if (action === "reveal") {
        await revealInFileManager(session.filePath);
        setNotice({ text: "opened in your file manager", tone: "info" });
        return;
      }

      const text =
        action === "markdown"
          ? toExportMarkdown(session)
          : toExportJson(session);
      await copyToClipboard(text);
      setNotice({
        text: `copied as ${action === "markdown" ? "Markdown" : "JSON"} (${formatSize(Buffer.byteLength(text))})`,
        tone: "info",
      });
    } catch (cause) {
      setNotice({ text: describe(cause), tone: "error" });
    }
  }

  useInput((chars, key) => {
    if (key.escape) {
      if (input.value.length > 0) {
        setInput(EMPTY_INPUT);
      } else {
        exit();
      }
      return;
    }

    if (key.tab) {
      setMode(nextMode);
      return;
    }

    if (key.ctrl && chars === "t") {
      setCaseSensitive((value) => !value);
      return;
    }

    const exportAction = key.ctrl ? EXPORT_KEYS[chars] : undefined;
    if (exportAction) {
      // Spawning a helper takes a few milliseconds; the key handler can't
      // wait for it, so the result lands in the header when it arrives.
      void runExport(exportAction);
      return;
    }

    if (key.upArrow || key.downArrow) {
      setSelected((current) =>
        moveSelection(current, key.upArrow ? -1 : 1, results.length),
      );
      setScroll(0);
      return;
    }

    if (key.pageUp || key.pageDown) {
      const page = Math.max(1, bodyHeight - 2);
      setScroll((current) =>
        Math.max(0, current + (key.pageUp ? -page : page)),
      );
      return;
    }

    setInput((state) => applyEdit(state, chars, key));
  });

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Box>
        <Text bold color="cyan">
          ccf
        </Text>
        {notice ? (
          <Text
            color={notice.tone === "error" ? "red" : "green"}
            wrap="truncate"
          >{`  ${notice.text}`}</Text>
        ) : (
          <Text
            dimColor
            wrap="truncate"
          >{`  ${statusLine(index, search)}`}</Text>
        )}
      </Box>

      <SearchInput
        value={input.value}
        cursor={input.cursor}
        mode={mode}
        caseSensitive={caseSensitive}
      />

      <Box flexGrow={1} height={bodyHeight}>
        <Box width={listWidth} flexDirection="column">
          {renderListBody(index, search, isSearching, {
            selected,
            height: bodyHeight,
            width: listWidth,
          })}
        </Box>
        <Box
          borderStyle="single"
          borderColor="gray"
          borderDimColor
          borderTop={false}
          borderBottom={false}
          borderRight={false}
          paddingLeft={1}
          flexGrow={1}
        >
          <PreviewPane
            session={session}
            scroll={scroll}
            width={previewWidth}
            height={bodyHeight}
          />
        </Box>
      </Box>

      <Box width={columns}>
        <Text dimColor wrap="truncate">
          {footerHint(columns)}
        </Text>
      </Box>
    </Box>
  );
}

function renderListBody(
  index: IndexState,
  search: SearchState,
  isSearching: boolean,
  layout: { selected: number; height: number; width: number },
) {
  if (index.status === "error") {
    return <Text color="red">Indexing failed: {index.message}</Text>;
  }
  if (index.status === "indexing") {
    return <Text dimColor>Indexing your chat history…</Text>;
  }
  if (search.error && !isSearching) {
    return <Text color="red">{search.error}</Text>;
  }

  // While the debounce is pending the previous results stay on screen; only
  // an empty screen needs a placeholder.
  if (search.results.length === 0) {
    if (isSearching) return <Text dimColor>Searching…</Text>;
    if (search.query === "") {
      return <Text dimColor>Type to search your chat history.</Text>;
    }
    return <Text dimColor>No sessions match.</Text>;
  }

  return (
    <ResultList
      results={search.results}
      selected={layout.selected}
      height={layout.height}
      width={layout.width}
    />
  );
}

function statusLine(index: IndexState, search: SearchState): string {
  if (index.status === "indexing") return "indexing…";
  if (index.status === "error") return "index unavailable";
  if (search.error) return "invalid query";

  const { sessionsIndexed, sessionsUnchanged } = index.stats;
  const total = sessionsIndexed + sessionsUnchanged;
  const sessions = `${total} session${total === 1 ? "" : "s"} indexed`;
  return search.results.length > 0
    ? `${sessions} · ${search.results.length} matching`
    : sessions;
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
