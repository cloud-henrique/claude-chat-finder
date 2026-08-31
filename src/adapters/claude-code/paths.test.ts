import { describe, expect, test } from "bun:test";
import { resolveClaudeProjectsRoot } from "./paths";

describe("resolveClaudeProjectsRoot", () => {
  test("resolves a Linux home directory", () => {
    expect(resolveClaudeProjectsRoot("/home/jane", "linux")).toBe(
      "/home/jane/.claude/projects",
    );
  });

  test("resolves a macOS home directory", () => {
    expect(resolveClaudeProjectsRoot("/Users/jane", "darwin")).toBe(
      "/Users/jane/.claude/projects",
    );
  });

  test("resolves a Windows home directory with backslashes", () => {
    expect(resolveClaudeProjectsRoot("C:\\Users\\Jane", "win32")).toBe(
      "C:\\Users\\Jane\\.claude\\projects",
    );
  });
});
