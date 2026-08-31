import { describe, expect, test } from "bun:test";
import { resolveIndexDbPath } from "./paths";

describe("resolveIndexDbPath", () => {
  test("resolves under Application Support on macOS", () => {
    expect(resolveIndexDbPath("/Users/jane", "darwin", {})).toBe(
      "/Users/jane/Library/Application Support/claude-chat-finder/index.sqlite",
    );
  });

  test("resolves under the XDG data dir on Linux by default", () => {
    expect(resolveIndexDbPath("/home/jane", "linux", {})).toBe(
      "/home/jane/.local/share/claude-chat-finder/index.sqlite",
    );
  });

  test("respects XDG_DATA_HOME when set on Linux", () => {
    expect(
      resolveIndexDbPath("/home/jane", "linux", {
        XDG_DATA_HOME: "/home/jane/.xdgdata",
      }),
    ).toBe("/home/jane/.xdgdata/claude-chat-finder/index.sqlite");
  });

  test("resolves under %LOCALAPPDATA% on Windows by default", () => {
    expect(resolveIndexDbPath("C:\\Users\\Jane", "win32", {})).toBe(
      "C:\\Users\\Jane\\AppData\\Local\\claude-chat-finder\\Data\\index.sqlite",
    );
  });

  test("respects LOCALAPPDATA when set on Windows", () => {
    expect(
      resolveIndexDbPath("C:\\Users\\Jane", "win32", {
        LOCALAPPDATA: "D:\\LocalData",
      }),
    ).toBe("D:\\LocalData\\claude-chat-finder\\Data\\index.sqlite");
  });
});
