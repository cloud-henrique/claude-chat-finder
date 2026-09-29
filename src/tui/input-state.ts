/**
 * Editing model for the search field, kept as a pure reducer so every key
 * behavior is unit-testable without mounting a terminal.
 */

export interface TextInputState {
  value: string;
  /** Caret position, between 0 and `value.length`. */
  cursor: number;
}

/** The subset of Ink's `Key` this reducer reacts to. */
export interface EditKey {
  leftArrow?: boolean;
  rightArrow?: boolean;
  backspace?: boolean;
  delete?: boolean;
  home?: boolean;
  end?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}

export const EMPTY_INPUT: TextInputState = { value: "", cursor: 0 };

/** Applies one key press to the field, returning the next state. */
export function applyEdit(
  state: TextInputState,
  input: string,
  key: EditKey,
): TextInputState {
  const cursor = clampCursor(state.cursor, state.value);

  if (key.ctrl) {
    if (input === "u") return EMPTY_INPUT;
    if (input === "w") return deleteWordBefore({ ...state, cursor });
    if (input === "a") return { value: state.value, cursor: 0 };
    if (input === "e")
      return { value: state.value, cursor: state.value.length };
    return state;
  }

  if (key.leftArrow)
    return { value: state.value, cursor: Math.max(0, cursor - 1) };
  if (key.rightArrow) {
    return {
      value: state.value,
      cursor: Math.min(state.value.length, cursor + 1),
    };
  }
  if (key.home) return { value: state.value, cursor: 0 };
  if (key.end) return { value: state.value, cursor: state.value.length };

  // Terminals disagree about which code the Backspace key emits (`\b` vs.
  // `\x7f`), and Ink reports them as `backspace` and `delete` respectively —
  // so both are treated as "delete the character before the caret".
  if (key.backspace || key.delete) {
    if (cursor === 0) return { value: state.value, cursor };
    return {
      value: state.value.slice(0, cursor - 1) + state.value.slice(cursor),
      cursor: cursor - 1,
    };
  }

  if (key.meta) return state;

  const text = stripNonPrintable(input);
  if (text.length === 0) return state;

  return {
    value: state.value.slice(0, cursor) + text + state.value.slice(cursor),
    cursor: cursor + text.length,
  };
}

/**
 * Drops control characters and escape-sequence leftovers so a stray key never
 * ends up inside the query.
 */
function stripNonPrintable(text: string): string {
  let printable = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 0x20 && code !== 0x7f) printable += char;
  }
  return printable;
}

function deleteWordBefore(state: TextInputState): TextInputState {
  const before = state.value.slice(0, state.cursor);
  const trimmed = before.replace(/\S+\s*$/, "");
  return {
    value: trimmed + state.value.slice(state.cursor),
    cursor: trimmed.length,
  };
}

function clampCursor(cursor: number, value: string): number {
  return Math.min(Math.max(0, cursor), value.length);
}
