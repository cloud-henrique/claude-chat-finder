#!/usr/bin/env bun

import { render } from "ink";
import { ClaudeCodeAdapter } from "./adapters/claude-code";
import { buildIndex } from "./indexing/build";
import { openIndexDb } from "./indexing/db";
import { App } from "./tui/app";
import { deferConsole } from "./tui/console";

/** How many held-back diagnostics to print after the TUI exits. */
const MAX_REPORTED_WARNINGS = 5;

// The TUI reads keys in raw mode and repaints the screen, so it needs a real
// terminal on both ends. Saying so beats Ink's raw-mode stack trace.
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error(
    "ccf needs an interactive terminal — it can't run with its input or output redirected.",
  );
  process.exit(1);
}

const db = await openIndexDb();
const adapters = [new ClaudeCodeAdapter()];
const runIndex = () => buildIndex(db, adapters);

const deferred = deferConsole();

// The alternate screen keeps the user's scrollback intact — the TUI takes over
// the terminal like `less` does and restores it on exit. Ink's own console
// patching is off because `deferConsole` already holds output back.
const instance = render(<App db={db} runIndex={runIndex} />, {
  alternateScreen: true,
  patchConsole: false,
});

await instance.waitUntilExit();

const messages = deferred.restore();
db.close();

for (const message of messages.slice(0, MAX_REPORTED_WARNINGS)) {
  console.warn(message);
}
if (messages.length > MAX_REPORTED_WARNINGS) {
  console.warn(`… and ${messages.length - MAX_REPORTED_WARNINGS} more`);
}
