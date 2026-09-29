import { Buffer } from "node:buffer";

/**
 * Which binary each export action runs on each OS.
 *
 * Every per-platform decision lives here as a pure function taking
 * `platform`/`env`, so all three targets are assertable from a single test
 * host — the same pattern as `indexing/paths.ts` and
 * `adapters/claude-code/paths.ts`. Spawning stays a thin wrapper in `run.ts`,
 * because that is the part no test can exercise on a foreign OS.
 */

export interface LaunchCommand {
  command: string;
  args: string[];
  /**
   * Windows only: hand the argument list to the process exactly as written
   * instead of letting the spawner quote it. Explorer parses its own command
   * line and mis-reads `"/select,C:\dir\file"` as a whole, so the path has to
   * carry the quotes itself — see `revealCommand`.
   */
  verbatimArguments?: boolean;
}

/**
 * How the clipboard helper expects its stdin to be encoded. Windows' `clip`
 * decodes UTF-8 bytes as the console's OEM code page and mangles anything
 * outside ASCII, but reads UTF-16LE correctly when the BOM says so.
 */
export type ClipboardEncoding = "utf-8" | "utf-16le-bom";

export interface ClipboardCommand extends LaunchCommand {
  encoding: ClipboardEncoding;
}

/** The clipboard helper for a platform: it reads the text from stdin. */
export function clipboardCommand(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): ClipboardCommand {
  if (platform === "darwin") {
    return { command: "pbcopy", args: [], encoding: "utf-8" };
  }

  if (platform === "win32") {
    return { command: "clip", args: [], encoding: "utf-16le-bom" };
  }

  // A Wayland session usually has no X server for xclip to talk to, and
  // WAYLAND_DISPLAY is the one marker every compositor sets.
  if (env.WAYLAND_DISPLAY) {
    return { command: "wl-copy", args: [], encoding: "utf-8" };
  }

  return {
    command: "xclip",
    args: ["-selection", "clipboard"],
    encoding: "utf-8",
  };
}

/**
 * The file-manager command that shows a session's file to the user.
 *
 * macOS and Windows can select the file itself; on Linux there is no portable
 * way to ask for that, so `xdg-open` gets the containing directory.
 */
export function revealCommand(
  filePath: string,
  platform: NodeJS.Platform = process.platform,
): LaunchCommand {
  if (platform === "darwin") {
    return { command: "open", args: ["-R", filePath] };
  }

  if (platform === "win32") {
    return {
      command: "explorer.exe",
      args: [`/select,"${filePath}"`],
      verbatimArguments: true,
    };
  }

  return { command: "xdg-open", args: [containingDirectory(filePath)] };
}

/** Encodes clipboard text the way the platform's helper expects to read it. */
export function encodeClipboardText(
  text: string,
  encoding: ClipboardEncoding,
): Uint8Array {
  if (encoding === "utf-16le-bom") {
    const body = Buffer.from(text, "utf16le");
    const bytes = new Uint8Array(2 + body.byteLength);
    bytes.set([0xff, 0xfe]);
    bytes.set(body, 2);
    return bytes;
  }

  return new TextEncoder().encode(text);
}

/**
 * The directory holding a file, for either separator — the path comes from
 * the index, so it uses whichever convention the OS that wrote it uses.
 */
function containingDirectory(filePath: string): string {
  const cut = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  if (cut < 0) return filePath;
  // A file directly under the root: its directory is the separator itself.
  return cut === 0 ? filePath.slice(0, 1) : filePath.slice(0, cut);
}
