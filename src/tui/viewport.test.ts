import { describe, expect, test } from "bun:test";
import { clampScroll, moveSelection, visibleWindow } from "./viewport";

describe("moveSelection", () => {
  test("moves within the list without wrapping around", () => {
    expect(moveSelection(0, 1, 5)).toBe(1);
    expect(moveSelection(0, -1, 5)).toBe(0);
    expect(moveSelection(4, 1, 5)).toBe(4);
  });

  test("stays at zero for an empty list", () => {
    expect(moveSelection(0, 1, 0)).toBe(0);
  });
});

describe("visibleWindow", () => {
  test("shows the whole list when it fits", () => {
    expect(visibleWindow(0, 3, 10)).toEqual({ start: 0, end: 3 });
  });

  test("keeps the selection centered while scrolling", () => {
    expect(visibleWindow(10, 100, 10)).toEqual({ start: 5, end: 15 });
  });

  test("stays flush at both ends of the list", () => {
    expect(visibleWindow(0, 100, 10)).toEqual({ start: 0, end: 10 });
    expect(visibleWindow(99, 100, 10)).toEqual({ start: 90, end: 100 });
  });

  test("always keeps the selection inside the window", () => {
    for (let selected = 0; selected < 50; selected++) {
      const { start, end } = visibleWindow(selected, 50, 7);
      expect(selected).toBeGreaterThanOrEqual(start);
      expect(selected).toBeLessThan(end);
    }
  });

  test("returns an empty window for an empty list or zero height", () => {
    expect(visibleWindow(0, 0, 10)).toEqual({ start: 0, end: 0 });
    expect(visibleWindow(0, 10, 0)).toEqual({ start: 0, end: 0 });
  });
});

describe("clampScroll", () => {
  test("clamps to the last full page", () => {
    expect(clampScroll(100, 30, 10)).toBe(20);
    expect(clampScroll(-5, 30, 10)).toBe(0);
    expect(clampScroll(5, 30, 10)).toBe(5);
  });

  test("cannot scroll content that fits", () => {
    expect(clampScroll(5, 8, 10)).toBe(0);
  });
});
