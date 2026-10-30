/**
 * Scaffold smoke test: `pnpm test:scaffold`.
 *
 * In a temporary git worktree (never in this checkout), it scaffolds one component per variant of
 * the scaffold-component skill and checks that:
 *   1. `check:placeholders` fails while the generated markers are there, naming every component;
 *   2. once the markers are resolved (the minimum: checklist deleted, placeholder story removed,
 *      marker prefixes dropped), `check:placeholders`, lint, typecheck and the ui tests pass.
 * The worktree starts from HEAD plus the uncommitted changes of this checkout, and is removed at
 * the end whatever happens, so no file is left behind and no tracked file is touched.
 * Plain Node (type stripping), no dependencies.
 */
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const MARKER = "SCAFFOLD-PLACEHOLDER";
const ROOT = new URL("../", import.meta.url).pathname;
const SCAFFOLD = ".claude/skills/scaffold-component/scaffold.mts";

/** One component per variant, with the options the skill documents. */
const COMPONENTS: { name: string; args: string[] }[] = [
  { name: "smoke-native", args: ["--variant", "native"] },
  {
    name: "smoke-radix",
    args: [
      "--variant",
      "radix",
      "--primitive",
      "@radix-ui/react-switch",
      "--role",
      "switch",
    ],
  },
  {
    name: "smoke-group",
    args: [
      "--variant",
      "group",
      "--primitive",
      "@radix-ui/react-radio-group",
      "--role",
      "radiogroup",
      "--item-role",
      "radio",
    ],
  },
  {
    name: "smoke-popover",
    args: ["--variant", "popover", "--primitive", "@radix-ui/react-select"],
  },
  {
    name: "smoke-subpath",
    args: ["--variant", "subpath", "--dependency", "input-otp"],
  },
];

const failures: string[] = [];
const check = (condition: boolean, message: string) => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${message}`);
  if (!condition) failures.push(message);
};

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

const listFiles = (folder: string): string[] =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(folder, entry.name))
      : [join(folder, entry.name)],
  );

/**
 * The minimum a person does to finish the scaffold: delete the checklist at the top of the
 * component, delete the placeholder interaction story and the stand-in comment, and keep the
 * texts that followed each marker.
 */
const resolveMarkers = (file: string) => {
  let text = readFileSync(file, "utf8");
  if (!text.includes(MARKER)) return;
  if (file.endsWith(".stories.tsx")) {
    const story = text.indexOf(`/**\n * ${MARKER}: replace this story`);
    if (story !== -1) text = `${text.slice(0, story).trimEnd()}\n`;
  } else if (file.endsWith(".tsx")) {
    const lines = text.split("\n");
    const firstCode = lines.findIndex((line) => !line.startsWith("//"));
    text = lines
      .slice(firstCode)
      .filter((line) => !line.trim().startsWith(`{/* ${MARKER}`))
      .join("\n");
  }
  writeFileSync(file, text.replaceAll(`${MARKER}: `, ""));
};

const worktree = mkdtempSync(join(tmpdir(), "scaffold-smoke-"));
rmSync(worktree, { recursive: true });

try {
  must("git", ["worktree", "add", "--detach", worktree, "HEAD"], ROOT);

  // The uncommitted state of this checkout, so a template being edited is the one tested.
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

  for (const { name, args } of COMPONENTS) {
    const created = run("node", [SCAFFOLD, "create", name, ...args], worktree);
    check(created.status === 0, `scaffold ${name} (${args[1]})`);
    if (created.status !== 0) console.error(created.stdout, created.stderr);
  }

  const before = run("node", ["scripts/check-placeholders.mts"], worktree);
  check(
    before.status !== 0,
    "check:placeholders fails while the markers are there",
  );
  for (const { name } of COMPONENTS) {
    check(
      before.stderr.includes(`packages/ui/src/components/${name}/${name}.tsx`),
      `check:placeholders names the checklist of ${name}`,
    );
  }
  check(
    before.stderr.includes("packages/ui/README.md"),
    "check:placeholders names the README paragraph of the subpath component",
  );

  const generated = [
    ...listFiles(join(worktree, "packages/ui/src")),
    ...listFiles(join(worktree, ".changeset")),
    join(worktree, "packages/ui/README.md"),
  ];
  for (const file of generated) resolveMarkers(file);
  must("pnpm", ["exec", "prettier", "--write", ...generated], worktree);

  const after = run("node", ["scripts/check-placeholders.mts"], worktree);
  check(after.status === 0, "check:placeholders passes once they are resolved");

  // `--force`: Turborepo 2.8+ shares the local cache between git worktrees, and the generated
  // files are the same on every run, so without it these tasks are replayed from an earlier run
  // instead of executed. The cache line of each task is printed as proof ("force executing").
  for (const task of ["lint", "typecheck", "test"]) {
    const result = run(
      "pnpm",
      [
        "turbo",
        "run",
        task,
        "--filter=@aleixvidal/ui",
        "--force",
        "--output-logs=hash-only",
      ],
      worktree,
    );
    for (const line of result.stdout.split("\n")) {
      if (/cache (hit|miss|bypass)/.test(line))
        console.log(`      ${line.trim()}`);
    }
    check(result.status === 0, `${task} passes with the five components`);
    if (result.status !== 0) console.error(result.stdout, result.stderr);
  }
} catch (error) {
  failures.push(String(error));
  console.error(error);
} finally {
  run("git", ["worktree", "remove", "--force", worktree], ROOT);
  rmSync(worktree, { recursive: true, force: true });
  run("git", ["worktree", "prune"], ROOT);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("\nThe scaffold works for every variant.");
