import { describe, expect, test } from "bun:test";
import { deferConsole } from "./console";

function fakeConsole(sink: string[]): Console {
  const record =
    (level: string) =>
    (...args: unknown[]) => {
      sink.push(`${level}:${args.join(" ")}`);
    };
  return {
    log: record("log"),
    info: record("info"),
    warn: record("warn"),
    error: record("error"),
    debug: record("debug"),
  } as unknown as Console;
}

describe("deferConsole", () => {
  test("captures output instead of writing it out", () => {
    const written: string[] = [];
    const target = fakeConsole(written);

    const deferred = deferConsole(target);
    target.warn("skipping", "a file");
    target.error("boom");

    expect(written).toEqual([]);
    expect(deferred.restore()).toEqual(["skipping a file", "boom"]);
  });

  test("restores the original methods", () => {
    const written: string[] = [];
    const target = fakeConsole(written);

    deferConsole(target).restore();
    target.warn("after");

    expect(written).toEqual(["warn:after"]);
  });
});
