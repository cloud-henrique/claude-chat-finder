import { describe, expect, test } from "bun:test";
import { formatDate, formatSize, formatTimestamp, shortenHome } from "./format";

describe("shortenHome", () => {
  test("replaces the home prefix with a tilde", () => {
    expect(shortenHome("/Users/foo/code/app", "/Users/foo")).toBe("~/code/app");
  });

  test("handles the Windows separator", () => {
    expect(shortenHome("C:\\Users\\foo\\app", "C:\\Users\\foo")).toBe("~\\app");
  });

  test("leaves paths outside the home directory alone", () => {
    expect(shortenHome("/opt/app", "/Users/foo")).toBe("/opt/app");
  });

  test("does not shorten a sibling directory with the same prefix", () => {
    expect(shortenHome("/Users/foobar/app", "/Users/foo")).toBe(
      "/Users/foobar/app",
    );
  });

  test("renders the home directory itself as a bare tilde", () => {
    expect(shortenHome("/Users/foo", "/Users/foo")).toBe("~");
  });
});

describe("formatDate", () => {
  test("formats an ISO timestamp as a plain date", () => {
    expect(formatDate("2026-09-28T13:45:00.000Z")).toBe("2026-09-28");
  });

  test("returns an empty string for an unparseable timestamp", () => {
    expect(formatDate("not a date")).toBe("");
    expect(formatDate("")).toBe("");
  });
});

describe("formatTimestamp", () => {
  test("formats a timestamp down to the minute", () => {
    expect(formatTimestamp("2026-09-28T13:45:12.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
    );
  });

  test("distinguishes timestamps an hour apart", () => {
    expect(formatTimestamp("2026-09-28T13:45:00.000Z")).not.toBe(
      formatTimestamp("2026-09-28T14:45:00.000Z"),
    );
  });

  test("returns an empty string for an unparseable timestamp", () => {
    expect(formatTimestamp("nope")).toBe("");
  });
});

describe("formatSize", () => {
  test("keeps small payloads in bytes", () => {
    expect(formatSize(0)).toBe("0 B");
    expect(formatSize(999)).toBe("999 B");
  });

  test("switches to kilobytes at a thousand bytes", () => {
    expect(formatSize(1000)).toBe("1.0 KB");
    expect(formatSize(12_400)).toBe("12.4 KB");
  });

  test("switches to megabytes at a million bytes", () => {
    expect(formatSize(2_500_000)).toBe("2.5 MB");
  });
});
