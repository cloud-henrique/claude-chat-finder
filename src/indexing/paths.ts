import { homedir } from "node:os";
import { posix, win32 } from "node:path";

const APP_NAME = "claude-chat-finder";
const DB_FILENAME = "index.sqlite";

/**
 * Resolves the local index database path per OS convention: XDG data dir on
 * Linux, Application Support on macOS, %LOCALAPPDATA% on Windows. Takes
 * `home`/`platform`/`env` as parameters (defaulting to the live process) so
 * every OS's convention is unit-testable from any host.
 */
export function resolveIndexDbPath(
  home: string = homedir(),
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (platform === "darwin") {
    return posix.join(
      home,
      "Library",
      "Application Support",
      APP_NAME,
      DB_FILENAME,
    );
  }

  if (platform === "win32") {
    const localAppData =
      env.LOCALAPPDATA || win32.join(home, "AppData", "Local");
    return win32.join(localAppData, APP_NAME, "Data", DB_FILENAME);
  }

  const xdgDataHome = env.XDG_DATA_HOME || posix.join(home, ".local", "share");
  return posix.join(xdgDataHome, APP_NAME, DB_FILENAME);
}
