import { describe, expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import {
  clipboardCommand,
  encodeClipboardText,
  revealCommand,
} from "./commands";

describe("clipboardCommand", () => {
  test("uses pbcopy on macOS", () => {
    expect(clipboardCommand("darwin", {})).toEqual({
      command: "pbcopy",
      args: [],
      encoding: "utf-8",
    });
  });

  test("uses clip with UTF-16 on Windows", () => {
    expect(clipboardCommand("win32", {})).toEqual({
      command: "clip",
      args: [],
      encoding: "utf-16le-bom",
    });
  });

  test("uses xclip on an X11 Linux session", () => {
    expect(clipboardCommand("linux", { DISPLAY: ":0" })).toEqual({
      command: "xclip",
      args: ["-selection", "clipboard"],
      encoding: "utf-8",
    });
  });

  test("uses wl-copy when the Linux session is Wayland", () => {
    expect(clipboardCommand("linux", { WAYLAND_DISPLAY: "wayland-0" })).toEqual(
      { command: "wl-copy", args: [], encoding: "utf-8" },
    );
  });

  // Runs the branch for whichever OS the test host is — which is how the
  // Windows and Linux CI runners cover code this machine never executes.
  test("resolves a command for the running platform", () => {
    const { command, encoding } = clipboardCommand();
    const expected: Partial<Record<NodeJS.Platform, string>> = {
      darwin: "pbcopy",
      win32: "clip",
    };
    expect(command).toBe(
      expected[process.platform] ??
        (process.env.WAYLAND_DISPLAY ? "wl-copy" : "xclip"),
    );
    expect(encoding).toBe(
      process.platform === "win32" ? "utf-16le-bom" : "utf-8",
    );
  });
});

describe("revealCommand", () => {
  test("reveals the file itself in Finder on macOS", () => {
    expect(
      revealCommand("/Users/jane/.claude/projects/app/s1.jsonl", "darwin"),
    ).toEqual({
      command: "open",
      args: ["-R", "/Users/jane/.claude/projects/app/s1.jsonl"],
    });
  });

  test("selects the file in Explorer on Windows, quoting the path itself", () => {
    expect(
      revealCommand(
        "C:\\Users\\Jane Doe\\.claude\\projects\\s1.jsonl",
        "win32",
      ),
    ).toEqual({
      command: "explorer.exe",
      args: ['/select,"C:\\Users\\Jane Doe\\.claude\\projects\\s1.jsonl"'],
      verbatimArguments: true,
    });
  });

  test("opens the containing directory on Linux", () => {
    expect(
      revealCommand("/home/jane/.claude/projects/app/s1.jsonl", "linux"),
    ).toEqual({
      command: "xdg-open",
      args: ["/home/jane/.claude/projects/app"],
    });
  });

  test("falls back to the root for a file with no directory part", () => {
    expect(revealCommand("/s1.jsonl", "linux").args).toEqual(["/"]);
  });

  test("resolves a command for the running platform", () => {
    const expected: Partial<Record<NodeJS.Platform, string>> = {
      darwin: "open",
      win32: "explorer.exe",
    };
    expect(revealCommand("/tmp/s1.jsonl").command).toBe(
      expected[process.platform] ?? "xdg-open",
    );
  });
});

describe("encodeClipboardText", () => {
  test("encodes UTF-8 without a BOM", () => {
    const bytes = encodeClipboardText("olá", "utf-8");
    expect([...bytes]).toEqual([0x6f, 0x6c, 0xc3, 0xa1]);
  });

  test("prefixes UTF-16 output with a little-endian BOM", () => {
    const bytes = encodeClipboardText("ok", "utf-16le-bom");
    expect([...bytes]).toEqual([0xff, 0xfe, 0x6f, 0x00, 0x6b, 0x00]);
  });

  test("keeps non-ASCII text intact through UTF-16", () => {
    const bytes = encodeClipboardText("café ✅", "utf-16le-bom");
    const decoded = Buffer.from(bytes.slice(2)).toString("utf16le");
    expect(decoded).toBe("café ✅");
  });

  test("keeps surrogate pairs intact through UTF-16", () => {
    const bytes = encodeClipboardText("🎉", "utf-16le-bom");
    expect(Buffer.from(bytes.slice(2)).toString("utf16le")).toBe("🎉");
  });
});
