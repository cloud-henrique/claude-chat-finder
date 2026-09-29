import { describe, expect, test } from "bun:test";
import { footerHint } from "./footer";

describe("footerHint", () => {
  test("shows every hint when the terminal is wide", () => {
    const hint = footerHint(200);

    expect(hint).toBe(
      "↑↓ results · PgUp/PgDn scroll · Tab mode · ^T case · ^Y md · ^R json · ^O reveal · ^U clear · ^C quit",
    );
  });

  test("fits into 80 columns", () => {
    expect(footerHint(80).length).toBeLessThanOrEqual(80);
  });

  test("keeps every export shortcut at 80 columns", () => {
    const hint = footerHint(80);

    expect(hint).toContain("^Y md");
    expect(hint).toContain("^R json");
    expect(hint).toContain("^O reveal");
  });

  test("keeps the hints in reading order as it drops them", () => {
    const hint = footerHint(60);
    const positions = ["↑↓ results", "^Y md", "^R json", "^O reveal"].map(
      (text) => hint.indexOf(text),
    );

    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test("drops the least important hints first", () => {
    const hint = footerHint(70);

    expect(hint).not.toContain("^U clear");
    expect(hint).toContain("↑↓ results");
    expect(hint).toContain("^C quit");
  });

  test("never drops the quit hint, however narrow the terminal", () => {
    expect(footerHint(4)).toBe("^C quit");
    expect(footerHint(0)).toBe("^C quit");
  });
});
