import { Box, Text } from "ink";
import type { SearchMode } from "../search-mode";
import { MODE_LABELS } from "../search-mode";

interface SearchInputProps {
  value: string;
  cursor: number;
  mode: SearchMode;
  caseSensitive: boolean;
}

/** The query field: prompt, inline caret, and the active search modifiers. */
export function SearchInput({
  value,
  cursor,
  mode,
  caseSensitive,
}: SearchInputProps) {
  const caret = value[cursor] ?? " ";

  return (
    <Box>
      <Text color="cyan" bold>
        {"› "}
      </Text>
      <Box flexGrow={1}>
        <Text wrap="truncate-start">
          {value.slice(0, cursor)}
          <Text inverse>{caret}</Text>
          {value.slice(cursor + 1)}
        </Text>
      </Box>
      <Text
        dimColor={!caseSensitive}
        color={caseSensitive ? "green" : undefined}
      >
        {" Aa"}
      </Text>
      <Text color="green">{` ${MODE_LABELS[mode]}`}</Text>
    </Box>
  );
}
