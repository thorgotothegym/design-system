/**
 * Changeset exemption for dev-only dependency updates: `node scripts/dependabot-changeset.mts <base>`.
 *
 * Dependabot updates every package.json, and a dev-only update of a published package (a new
 * size-limit in packages/ui) would otherwise fail the changeset job, although consumers install
 * nothing new. This prints `exempt=true` (for $GITHUB_OUTPUT) only when, in every published
 * workspace package, the only changed file is package.json and only its `devDependencies` or
 * `size-limit` changed. A change to `dependencies`, `peerDependencies` or any other field, or to
 * any other file of a published package, prints `exempt=false`, and the changeset job then
 * requires a changeset as usual. The reason goes to stderr. Plain Node, no dependencies.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2];
if (!base) throw new Error("usage: dependabot-changeset.mts <base ref>");

/** Fields of package.json whose change never reaches a consumer. */
const DEV_ONLY_FIELDS = new Set(["devDependencies", "size-limit"]);

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8" });

type Manifest = Record<string, unknown> & { name?: string; private?: boolean };

const readManifest = (text: string): Manifest =>
  // package.json is a JSON object; only its top-level fields are compared.
  JSON.parse(text) as Manifest;

const publishedPackages = ["packages", "apps"]
  .filter((root) => existsSync(root))
  .flatMap((root) => readdirSync(root).map((name) => join(root, name)))
  .filter((dir) => existsSync(join(dir, "package.json")))
  .filter(
    (dir) =>
      !readManifest(readFileSync(join(dir, "package.json"), "utf8")).private,
  );

const changed = git("diff", "--name-only", `${base}...HEAD`)
  .split("\n")
  .filter(Boolean);

const reasons: string[] = [];
for (const dir of publishedPackages) {
  const manifestPath = `${dir}/package.json`;
  for (const file of changed.filter((path) => path.startsWith(`${dir}/`))) {
    if (file !== manifestPath) reasons.push(`${file} changed`);
  }
  if (!changed.includes(manifestPath)) continue;
  const before = readManifest(git("show", `${base}:${manifestPath}`));
  const after = readManifest(readFileSync(manifestPath, "utf8"));
  for (const field of new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ])) {
    const same = JSON.stringify(before[field]) === JSON.stringify(after[field]);
    if (!same && !DEV_ONLY_FIELDS.has(field)) {
      reasons.push(`${manifestPath}: "${field}" changed`);
    }
  }
}

if (reasons.length > 0) {
  console.error(`A changeset is required: ${reasons.join("; ")}.`);
  console.log("exempt=false");
} else {
  console.error(
    "Only devDependencies or size-limit of published packages changed: no changeset is required.",
  );
  console.log("exempt=true");
}
