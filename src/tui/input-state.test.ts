import { describe, expect, test } from "bun:test";
import { applyEdit, EMPTY_INPUT } from "./input-state";

const NO_KEY = {};

describe("applyEdit", () => {
  test("inserts typed characters at the caret", () => {
    const state = applyEdit(applyEdit(EMPTY_INPUT, "a", NO_KEY), "b", NO_KEY);

    expect(state).toEqual({ value: "ab", cursor: 2 });
  });

  test("inserts a pasted string in one step", () => {
    expect(applyEdit(EMPTY_INPUT, "hello world", NO_KEY)).toEqual({
      value: "hello world",
      cursor: 11,
    });
  });

  test("inserts in the middle when the caret was moved", () => {
    const state = applyEdit({ value: "ac", cursor: 1 }, "b", NO_KEY);

    expect(state).toEqual({ value: "abc", cursor: 2 });
  });

  test("deletes before the caret for both backspace encodings", () => {
    expect(
      applyEdit({ value: "ab", cursor: 2 }, "", { backspace: true }),
    ).toEqual({ value: "a", cursor: 1 });
    expect(applyEdit({ value: "ab", cursor: 2 }, "", { delete: true })).toEqual(
      {
        value: "a",
        cursor: 1,
      },
    );
  });

  test("backspace at the start of the field is a no-op", () => {
    expect(
      applyEdit({ value: "ab", cursor: 0 }, "", { backspace: true }),
    ).toEqual({ value: "ab", cursor: 0 });
  });

  test("moves the caret with the arrow, home, and end keys", () => {
    expect(
      applyEdit({ value: "abc", cursor: 3 }, "", { leftArrow: true }).cursor,
    ).toBe(2);
    expect(
      applyEdit({ value: "abc", cursor: 0 }, "", { rightArrow: true }).cursor,
    ).toBe(1);
    expect(
      applyEdit({ value: "abc", cursor: 2 }, "", { home: true }).cursor,
    ).toBe(0);
    expect(
      applyEdit({ value: "abc", cursor: 0 }, "", { end: true }).cursor,
    ).toBe(3);
  });

  test("clamps caret movement to the field's bounds", () => {
    expect(
      applyEdit({ value: "a", cursor: 0 }, "", { leftArrow: true }).cursor,
    ).toBe(0);
    expect(
      applyEdit({ value: "a", cursor: 1 }, "", { rightArrow: true }).cursor,
    ).toBe(1);
  });

  test("ctrl+u clears the field", () => {
    expect(applyEdit({ value: "abc", cursor: 3 }, "u", { ctrl: true })).toEqual(
      EMPTY_INPUT,
    );
  });

  test("ctrl+w deletes the word before the caret", () => {
    expect(
      applyEdit({ value: "one two three", cursor: 13 }, "w", { ctrl: true }),
    ).toEqual({ value: "one two ", cursor: 8 });
  });

  test("ignores unhandled ctrl and meta combinations", () => {
    const state = { value: "abc", cursor: 3 };

    expect(applyEdit(state, "k", { ctrl: true })).toEqual(state);
    expect(applyEdit(state, "x", { meta: true })).toEqual(state);
  });

  test("drops control characters instead of typing them", () => {
    expect(applyEdit(EMPTY_INPUT, "\u001b", NO_KEY)).toEqual(EMPTY_INPUT);
    expect(applyEdit(EMPTY_INPUT, "a\tb", NO_KEY)).toEqual({
      value: "ab",
      cursor: 2,
    });
  });
});
