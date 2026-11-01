/**
 * Release plan check: `pnpm check:release`.
 *
 * Runs `changeset version` in a temporary git worktree (never in this checkout) and fails if it
 * errors, so a pending changeset that would break the release is caught on the pull request that
 * adds it, not on release day. `changeset status --since` cannot catch it: it only reads the
 * changesets of the pull request, while `changeset version` reads all of them. Example: a
 * changeset that names the private @aleixvidal/tokens next to @aleixvidal/ui ("Mixed changesets
 * that contain both ignored and not ignored packages are not allowed").
 * The worktree starts from HEAD plus the uncommitted changes of this checkout, and is removed at
 * the end whatever happens, so no file is left behind and no tracked file is touched.
 * Plain Node (type stripping), no dependencies.
 */
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const PACKAGES = [
  "packages/ui",
  "packages/tokens",
  "packages/eslint-config",
  "packages/typescript-config",
  "apps/storybook",
];

const run = (command: string, args: string[], cwd: string) =>
  spawnSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });

/** Runs a command that must succeed; prints its output only when it fails. */
const must = (command: string, args: string[], cwd: string) => {
  const result = run(command, args, cwd);
  if (result.status !== 0) {
    console.error(result.stdout, result.stderr);
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
  return result.stdout;
};

const versionOf = (folder: string, packageDir: string) => {
  const file = join(folder, packageDir, "package.json");
  if (!existsSync(file)) return undefined;
  // JSON.parse returns `any`; every workspace package.json has a name and a version.
  const { name, version } = JSON.parse(readFileSync(file, "utf8")) as {
    name: string;
    version: string;
  };
  return { name, version };
};

const worktree = mkdtempSync(join(tmpdir(), "release-check-"));
rmSync(worktree, { recursive: true });
let failed = false;

try {
  must("git", ["worktree", "add", "--detach", worktree, "HEAD"], ROOT);

  // The uncommitted state of this checkout, so a changeset being written is the one checked.
  const diff = execFileSync("git", ["diff", "HEAD", "--binary"], {
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (diff.length > 0) {
    execFileSync("git", ["apply", "--whitespace=nowarn"], {
      cwd: worktree,
      input: diff,
    });
  }
  const untracked = must(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    ROOT,
  )
    .split("\n")
    .filter(Boolean);
  for (const file of untracked) {
    mkdirSync(dirname(join(worktree, file)), { recursive: true });
    copyFileSync(join(ROOT, file), join(worktree, file));
  }

  must("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], worktree);

  const result = run("pnpm", ["exec", "changeset", "version"], worktree);
  if (result.status !== 0) {
    failed = true;
    console.error(result.stdout, result.stderr);
    console.error("FAIL  changeset version fails on the pending changesets");
  } else {
    console.log("PASS  changeset version succeeds on the pending changesets");
    for (const packageDir of PACKAGES) {
      const before = versionOf(ROOT, packageDir);
      const after = versionOf(worktree, packageDir);
      if (before && after && before.version !== after.version) {
        console.log(
          `      ${after.name}: ${before.version} -> ${after.version}`,
        );
      }
    }
  }
} finally {
  run("git", ["worktree", "remove", "--force", worktree], ROOT);
  rmSync(worktree, { recursive: true, force: true });
  run("git", ["worktree", "prune"], ROOT);
}

if (failed) process.exit(1);
