import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const script = new URL("./vercel-ignore.sh", import.meta.url).pathname;
const appDir = new URL("..", import.meta.url).pathname;
const head = spawnSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).stdout.trim();

const temporaryDirs: string[] = [];

/**
 * A PATH whose `npx` exits with `code`, so no test downloads turbo or needs the network. It also
 * holds this Node (for `node -p`) and the system directories (for `git` and `sh`).
 */
const pathWithNpxExiting = (code: number) => {
  const dir = mkdtempSync(join(tmpdir(), "vercel-ignore-"));
  temporaryDirs.push(dir);
  writeFileSync(join(dir, "npx"), `#!/bin/sh\nexit ${code}\n`);
  chmodSync(join(dir, "npx"), 0o755);
  return `${dir}:${dirname(process.execPath)}:/usr/bin:/bin`;
};

/** Runs the script as Vercel does (from the app's root directory) and returns its exit code. */
const runIgnoreStep = (env: Record<string, string | undefined>) =>
  spawnSync("sh", [script], {
    cwd: appDir,
    encoding: "utf8",
    env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: undefined, ...env },
  }).status;

afterEach(() => {
  for (const dir of temporaryDirs.splice(0)) rmSync(dir, { recursive: true });
});

// Vercel skips a deployment on exit 0, builds on exit 1 and fails it on any other code.
describe("vercel-ignore.sh", () => {
  it("should build when there is no previous deployment", () => {
    expect(runIgnoreStep({})).toBe(1);
    expect(runIgnoreStep({ VERCEL_GIT_PREVIOUS_SHA: "" })).toBe(1);
  });

  it("should build when the previous commit is not in the clone", () => {
    expect(
      runIgnoreStep({
        VERCEL_GIT_PREVIOUS_SHA: "0123456789abcdef0123456789abcdef01234567",
      }),
    ).toBe(1);
  });

  it("should skip only when the Turborepo query exits with 0", () => {
    expect(
      runIgnoreStep({
        VERCEL_GIT_PREVIOUS_SHA: head,
        PATH: pathWithNpxExiting(0),
      }),
    ).toBe(0);
  });

  it.each([1, 2, 3, 127])(
    "should build when the Turborepo query exits with %i",
    (code) => {
      expect(
        runIgnoreStep({
          VERCEL_GIT_PREVIOUS_SHA: head,
          PATH: pathWithNpxExiting(code),
        }),
      ).toBe(1);
    },
  );
});
