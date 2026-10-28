/**
 * Scaffolds a component in packages/ui from the templates next to this file.
 *
 *   node .claude/skills/scaffold-component/scaffold.mts create <name> --variant native [--element input|textarea]
 *   node .claude/skills/scaffold-component/scaffold.mts create <name> --variant radix --primitive <package> --role <aria-role> [--part Thumb|Indicator]
 *   node .claude/skills/scaffold-component/scaffold.mts size <name>
 *
 * `create` writes the four component files, exports the component from the package entry, adds a
 * changeset stub and a provisional size-limit entry. `size` builds the package, measures the
 * component after tree-shaking and sets its size-limit to the measured size plus a small margin.
 * Plain Node (type stripping), no dependencies.
 */
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { parseArgs } from "node:util";

type Variant = "native" | "radix";

const ROOT = new URL("../../../", import.meta.url);
const TEMPLATES = new URL("templates/", import.meta.url);
const UI = new URL("packages/ui/", ROOT);
const PACKAGE_JSON = new URL("package.json", UI);

/** Provisional budgets, in the range of the existing components, until `size` measures the real one. */
const PROVISIONAL_LIMIT: Record<Variant, string> = {
  native: "9 kB",
  radix: "13.5 kB",
};

/** Headroom added to the measured size when `size` sets the budget. */
const MARGIN_KB = 0.3;

/** ARIA roles that support `aria-required`. A switch, for one, does not. */
const ARIA_REQUIRED_ROLES = new Set([
  "checkbox",
  "combobox",
  "gridcell",
  "listbox",
  "radiogroup",
  "spinbutton",
  "textbox",
  "tree",
  "treegrid",
]);

const fail = (message: string): never => {
  console.error(`scaffold-component: ${message}`);
  process.exit(1);
};

const toPascal = (kebab: string) =>
  kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const toCamel = (kebab: string) => {
  const pascal = toPascal(kebab);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

/** Keeps the lines between `//#if flag` and `//#endif` only when the flag is set (`//#if-not` inverts). */
const applyConditionals = (source: string, flags: Set<string>) => {
  const output: string[] = [];
  const keep: boolean[] = [];
  for (const line of source.split("\n")) {
    const directive = line.trim().match(/^\/\/#(if-not|if|endif)(?: (\w+))?$/);
    if (directive === null) {
      if (keep.every(Boolean)) output.push(line);
      continue;
    }
    const [, kind, flag] = directive;
    if (kind === "endif") keep.pop();
    else keep.push((kind === "if") === flags.has(flag ?? ""));
  }
  return output.join("\n");
};

const render = (
  template: string,
  tokens: Record<string, string>,
  flags: Set<string>,
) => {
  let text = applyConditionals(template, flags);
  for (const [token, value] of Object.entries(tokens)) {
    text = text.replaceAll(`__${token}__`, value);
  }
  const left = text.match(/__[A-Za-z]+__/);
  if (left !== null) fail(`template token left unreplaced: ${left[0]}`);
  return text;
};

const readPackageJson = (): {
  dependencies: Record<string, string>;
  "size-limit": { name: string; limit: string }[];
} => JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));

const writePackageJson = (pkg: object) =>
  writeFileSync(PACKAGE_JSON, `${JSON.stringify(pkg, null, 2)}\n`);

const run = (command: string, args: string[], cwd: URL = ROOT) =>
  spawnSync(command, args, { cwd, encoding: "utf8", stdio: "pipe" });

const create = (values: Record<string, string | undefined>, name: string) => {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    fail(`"${name}" is not kebab-case (for example "date-picker")`);
  }
  const variant = values.variant;
  if (variant !== "native" && variant !== "radix") {
    return fail('--variant must be "native" or "radix"');
  }
  const folder = new URL(`src/components/${name}/`, UI);
  if (existsSync(folder))
    fail(`packages/ui/src/components/${name} already exists`);

  const Name = toPascal(name);
  const tokens: Record<string, string> = {
    Name,
    name,
    nameCamel: toCamel(name),
  };
  const flags = new Set<string>();

  if (variant === "native") {
    const element = values.element ?? "input";
    if (element !== "input" && element !== "textarea") {
      fail('--element must be "input" or "textarea"');
    }
    tokens.element = element;
    tokens.HtmlElement =
      element === "input" ? "HTMLInputElement" : "HTMLTextAreaElement";
    flags.add(element);
  } else {
    const primitive = values.primitive;
    const role = values.role;
    if (primitive === undefined || role === undefined) {
      return fail(
        "--variant radix needs --primitive <package> and --role <aria-role>",
      );
    }
    if (readPackageJson().dependencies[primitive] === undefined) {
      fail(
        `${primitive} is not a dependency of @aleixvidal/ui. Check its current docs, then run: pnpm --filter @aleixvidal/ui add ${primitive}@<exact version>`,
      );
    }
    const part = values.part ?? "Thumb";
    tokens.primitive = primitive;
    tokens.role = role;
    tokens.Part = part;
    tokens.partKebab = part.toLowerCase();
    tokens.Namespace = `${toPascal((primitive.split("/").pop() ?? "").replace(/^react-/, ""))}Primitive`;
    if (ARIA_REQUIRED_ROLES.has(role)) flags.add("requiredSupported");
  }

  const files: [template: string, target: string][] = [
    ["component.tsx.tpl", `${name}.tsx`],
    ["stories.tsx.tpl", `${name}.stories.tsx`],
    ["test.tsx.tpl", `${name}.test.tsx`],
    ["index.ts.tpl", "index.ts"],
  ];
  mkdirSync(folder, { recursive: true });
  const written: string[] = [];
  for (const [template, target] of files) {
    const source = readFileSync(
      new URL(`${variant}/${template}`, TEMPLATES),
      "utf8",
    );
    writeFileSync(new URL(target, folder), render(source, tokens, flags));
    written.push(`packages/ui/src/components/${name}/${target}`);
  }

  appendFileSync(
    new URL("src/index.ts", UI),
    `export { ${Name} } from "./components/${name}";\nexport type { ${Name}Props } from "./components/${name}";\n`,
  );

  const changeset = `.changeset/add-${name}.md`;
  writeFileSync(
    new URL(changeset, ROOT),
    `---\n"@aleixvidal/ui": minor\n---\n\nAdd the \`${Name}\` component. SCAFFOLD-PLACEHOLDER: describe what it does for the people who install the package.\n`,
  );
  written.push(changeset, "packages/ui/src/index.ts");

  const pkg = readPackageJson();
  const entry = {
    name: Name,
    path: "dist/index.js",
    import: `{ ${Name} }`,
    ignore: ["react", "react-dom"],
    limit: PROVISIONAL_LIMIT[variant],
  };
  const cssAt = pkg["size-limit"].findIndex((item) =>
    item.name.startsWith("CSS"),
  );
  pkg["size-limit"].splice(
    cssAt === -1 ? pkg["size-limit"].length : cssAt,
    0,
    entry,
  );
  writePackageJson(pkg);
  written.push("packages/ui/package.json");

  const prettier = run("pnpm", ["exec", "prettier", "--write", ...written]);
  if (prettier.status !== 0) fail(`prettier failed:\n${prettier.stderr}`);

  console.log(
    `Created ${Name} (${variant}). Files:\n  ${written.join("\n  ")}`,
  );
  console.log(
    `\nNext: node .claude/skills/scaffold-component/scaffold.mts size ${name}\nThen resolve every SCAFFOLD-PLACEHOLDER: pnpm check:placeholders`,
  );
};

const size = (name: string) => {
  const Name = toPascal(name);
  const pkg = readPackageJson();
  const entry = pkg["size-limit"].find((item) => item.name === Name);
  if (entry === undefined)
    fail(`no size-limit entry named ${Name} in packages/ui/package.json`);

  const build = run("pnpm", ["--filter", "@aleixvidal/ui", "build"]);
  if (build.status !== 0)
    fail(`build failed:\n${build.stdout}\n${build.stderr}`);

  const measured = run("pnpm", [
    "--filter",
    "@aleixvidal/ui",
    "exec",
    "size-limit",
    "--json",
  ]);
  // When a budget is exceeded, size-limit and pnpm print more after the JSON array, so keep only
  // the array: from the first "[" to the "]" that closes it at the start of a line.
  const start = measured.stdout.indexOf("[");
  const json = measured.stdout.slice(
    start,
    measured.stdout.indexOf("\n]", start) + 2,
  );
  const results: { name: string; size: number }[] = JSON.parse(json);
  const result = results.find((item) => item.name === Name);
  if (result === undefined)
    fail(`size-limit did not report ${Name}:\n${measured.stdout}`);

  const kb = (result?.size ?? 0) / 1000;
  const limit = `${Math.ceil((kb + MARGIN_KB) * 10) / 10} kB`;
  const updated = readPackageJson();
  const target = updated["size-limit"].find((item) => item.name === Name);
  if (target !== undefined) target.limit = limit;
  writePackageJson(updated);

  console.log(
    `${Name}: ${kb.toFixed(2)} kB measured after tree-shaking (brotli). Budget set to ${limit}.`,
  );
};

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    variant: { type: "string" },
    element: { type: "string" },
    primitive: { type: "string" },
    role: { type: "string" },
    part: { type: "string" },
  },
});
const [command, name] = positionals;

if (name === undefined)
  fail("usage: scaffold.mts <create|size> <name> [options]");
else if (command === "create") create(values, name);
else if (command === "size") size(name);
else fail(`unknown command "${command}"`);
