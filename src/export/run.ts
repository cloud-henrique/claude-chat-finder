import {
  clipboardCommand,
  encodeClipboardText,
  revealCommand,
} from "./commands";

/**
 * The thin spawning layer over `commands.ts`. Everything decidable is decided
 * there, in pure functions; what is left here is starting a process and
 * turning its failure into a sentence the user can act on.
 *
 * Both helpers run local OS binaries only — nothing here reaches the network.
 */

/** Puts `text` on the system clipboard using the platform's helper. */
export async function copyToClipboard(
  text: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const { command, args, encoding } = clipboardCommand(platform, env);

  const proc = (() => {
    try {
      return Bun.spawn({
        cmd: [command, ...args],
        stdin: "pipe",
        stdout: "ignore",
        stderr: "pipe",
        windowsHide: true,
      });
    } catch (cause) {
      throw new Error(describeStartFailure(command, cause));
    }
  })();

  proc.stdin.write(encodeClipboardText(text, encoding));
  await proc.stdin.end();

  await requireSuccess(proc, command);
}

/** Shows a session's file in the OS file manager. */
export async function revealInFileManager(
  filePath: string,
  platform: NodeJS.Platform = process.platform,
): Promise<void> {
  const { command, args, verbatimArguments } = revealCommand(
    filePath,
    platform,
  );

  const proc = (() => {
    try {
      return Bun.spawn({
        cmd: [command, ...args],
        stdin: "ignore",
        stdout: "ignore",
        stderr: "pipe",
        windowsVerbatimArguments: verbatimArguments,
        windowsHide: true,
      });
    } catch (cause) {
      throw new Error(describeStartFailure(command, cause));
    }
  })();

  // Explorer reports exit code 1 even when it opened the window, so on
  // Windows the exit status says nothing about whether this worked.
  if (platform === "win32") return;

  await requireSuccess(proc, command);
}

async function requireSuccess(
  proc: { exited: Promise<number>; stderr: ReadableStream },
  command: string,
): Promise<void> {
  const status = await proc.exited;
  if (status === 0) return;

  const detail = lastLine(await new Response(proc.stderr).text());
  throw new Error(
    `${command} exited with ${status}${detail ? `: ${detail}` : ""}`,
  );
}

/**
 * The failure shows up in a one-line status, and these helpers put their
 * conclusion last — `xdg-open` prints one line per browser it failed to find
 * before saying what actually went wrong.
 */
function lastLine(text: string): string {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  return lines[lines.length - 1]?.trim() ?? "";
}

/**
 * A missing helper is the expected failure on Linux, where neither clipboard
 * tool ships by default — so that case says what to install instead of
 * repeating an errno.
 */
function describeStartFailure(command: string, cause: unknown): string {
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code: unknown }).code)
      : "";

  if (code !== "ENOENT") {
    const message = cause instanceof Error ? cause.message : String(cause);
    return `couldn't run ${command}: ${message}`;
  }

  const install: Record<string, string> = {
    xclip: " — install xclip, or wl-clipboard on Wayland",
    "wl-copy": " — install wl-clipboard",
    "xdg-open": " — install xdg-utils",
  };
  return `${command} isn't installed${install[command] ?? ""}`;
}
