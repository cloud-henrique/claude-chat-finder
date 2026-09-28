type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";

const METHODS: ConsoleMethod[] = ["log", "info", "warn", "error", "debug"];

export interface DeferredConsole {
  /** Restores the real console methods and returns what was captured. */
  restore(): string[];
}

/**
 * Captures console output for the lifetime of the TUI.
 *
 * The TUI owns the whole terminal, so a stray `console.warn` (the adapter
 * emits one per skipped session file) would either corrupt the frame or
 * trigger a full redraw. Messages are held back and printed once the terminal
 * has been handed back to the shell.
 */
export function deferConsole(target: Console = console): DeferredConsole {
  const captured: string[] = [];
  const originals = new Map<ConsoleMethod, (...args: unknown[]) => void>();

  for (const method of METHODS) {
    originals.set(method, target[method].bind(target));
    target[method] = (...args: unknown[]) => {
      captured.push(args.map(stringify).join(" "));
    };
  }

  return {
    restore(): string[] {
      for (const [method, original] of originals) {
        target[method] = original;
      }
      return captured;
    },
  };
}

function stringify(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}
