import { describe, expect, test } from "bun:test";
import { nextMode, toSearchOptions } from "./search-mode";

describe("nextMode", () => {
  test("cycles through the three matching modes", () => {
    expect(nextMode("text")).toBe("word");
    expect(nextMode("word")).toBe("regex");
    expect(nextMode("regex")).toBe("text");
  });
});

describe("toSearchOptions", () => {
  test("maps each mode onto the search capability's flags", () => {
    expect(toSearchOptions("text", false)).toEqual({
      caseSensitive: false,
      wholeWord: false,
      regex: false,
    });
    expect(toSearchOptions("word", false).wholeWord).toBe(true);
    expect(toSearchOptions("regex", false).regex).toBe(true);
  });

  test("carries the case-sensitivity flag through", () => {
    expect(toSearchOptions("text", true).caseSensitive).toBe(true);
  });
});
