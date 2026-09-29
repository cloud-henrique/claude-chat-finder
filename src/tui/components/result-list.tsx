import { Box, Text } from "ink";
import type { SearchResult } from "../../search/search";
import { formatDate, shortenHome } from "../format";
import { visibleWindow } from "../viewport";

interface ResultListProps {
  results: SearchResult[];
  selected: number;
  height: number;
  width: number;
}

/** A project path needs at least this much room before a date is worth showing. */
const MIN_PATH_COLUMNS = 20;

/** The scrollable list of matching sessions, one line per session. */
export function ResultList({
  results,
  selected,
  height,
  width,
}: ResultListProps) {
  const { start, end } = visibleWindow(selected, results.length, height);
  const visible = results.slice(start, end).map((result, offset) => ({
    key: `${result.source}:${result.id}`,
    index: start + offset,
    result,
  }));

  return (
    <Box flexDirection="column" width={width}>
      {visible.map(({ key, index, result }) => {
        const isSelected = index === selected;
        const meta = rowMeta(result, width);

        return (
          <Box key={key}>
            <Text color={isSelected ? "cyan" : undefined} bold={isSelected}>
              {isSelected ? "❯ " : "  "}
            </Text>
            <Box flexGrow={1}>
              <Text
                wrap="truncate-start"
                color={isSelected ? "cyan" : undefined}
                bold={isSelected}
              >
                {shortenHome(result.projectPath)}
              </Text>
            </Box>
            {/* Never shrink the metadata: a half-truncated date says nothing,
                while a truncated path still shows the project's tail. */}
            <Box flexShrink={0}>
              <Text dimColor>{meta}</Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/** Match count, plus a short date when the row is wide enough to spare it. */
function rowMeta(result: SearchResult, width: number): string {
  const count = ` ${result.matches.length}`;
  const date = formatDate(result.matches[0]?.timestamp ?? "").slice(5);
  const withDate = ` ${date}${count}`;

  if (date.length === 0) return count;
  return width - 2 - withDate.length >= MIN_PATH_COLUMNS ? withDate : count;
}
