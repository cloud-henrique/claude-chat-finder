import { homedir } from "node:os";
import { posix, win32 } from "node:path";

/**
 * Resolves the Claude Code projects directory for a given home dir/platform.
 * Takes `home`/`platform` as parameters (defaulting to the live OS) so the
 * Windows path convention is unit-testable from any host.
 */
export function resolveClaudeProjectsRoot(
  home: string = homedir(),
  platform: NodeJS.Platform = process.platform,
): string {
  const path = platform === "win32" ? win32 : posix;
  return path.join(home, ".claude", "projects");
}
