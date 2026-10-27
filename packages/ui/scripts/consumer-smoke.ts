/**
 * Consumer smoke test: installs the packed `@aleixvidal/ui` in a clean temporary app, builds it
 * with Vite and checks the result in a real browser. Run with `pnpm test:consumer` (needs the
 * network, to install the temporary app, and Google Chrome; see packages/ui/README.md).
 *
 * The temporary app has its own dependencies (Vite, Playwright, React). Nothing is added to this
 * repository's packages and the directory is removed at the end.
 */
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { themeValues } from "@aleixvidal/tokens";

const require = createRequire(import.meta.url);
const packageRoot = new URL("..", import.meta.url).pathname;
const version = (name: string): string =>
  JSON.parse(readFileSync(require.resolve(`${name}/package.json`), "utf8"))
    .version;

/** Output is kept quiet (bundler warnings from dependencies); it is printed only if the command fails. */
const run = (command: string, args: string[], cwd: string): string => {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: "pipe",
    });
  } catch (error) {
    if (error instanceof Error && "stderr" in error)
      console.error(String(error.stderr));
    throw error;
  }
};

const failures: string[] = [];
const check = (condition: boolean, message: string) => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${message}`);
  if (!condition) failures.push(message);
};

const workDir = mkdtempSync(join(tmpdir(), "ui-consumer-"));

try {
  // 1. Pack exactly what would be published.
  const packed = run(
    "pnpm",
    ["pack", "--pack-destination", workDir],
    packageRoot,
  )
    .trim()
    .split("\n")
    .at(-1);
  if (!packed) throw new Error("pnpm pack printed no tarball path");

  // 2. A clean app that depends on the tarball and nothing from this workspace.
  const app = join(workDir, "app");
  mkdirSync(join(app, "src"), { recursive: true });
  writeFileSync(
    join(app, "package.json"),
    JSON.stringify({
      name: "consumer-smoke",
      private: true,
      type: "module",
      dependencies: {
        "@aleixvidal/ui": `file:${packed}`,
        react: version("react"),
        "react-dom": version("react-dom"),
      },
      devDependencies: { vite: "8.3.5", "playwright-core": "1.64.1" },
    }),
  );
  writeFileSync(
    join(app, "index.html"),
    '<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Consumer</title></head><body><h1 id="heading">Heading</h1><div id="root"></div><script type="module" src="/src/main.js"></script></body></html>',
  );
  // No JSX on purpose: the app needs no transform plugin.
  writeFileSync(
    join(app, "src", "main.js"),
    `import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { Field, Input } from "@aleixvidal/ui";
import "@aleixvidal/ui/styles.css";

createRoot(document.getElementById("root")).render(
  h(Field, null, h(Field.Label, null, "Name"), h(Input, { placeholder: "Ada" })),
);
`,
  );
  run("pnpm", ["install", "--ignore-workspace"], app);
  run("pnpm", ["exec", "vite", "build"], app);

  // 3. Inspect the shipped CSS.
  const cssPath = join(
    app,
    "node_modules",
    "@aleixvidal",
    "ui",
    "dist",
    "styles.css",
  );
  const css = readFileSync(cssPath, "utf8");
  check(
    !css.includes("--color-*"),
    "styles.css does not contain the tokens theme reset (--color-*: initial)",
  );
  check(
    !css.includes("-webkit-text-size-adjust"),
    "styles.css contains no preflight",
  );
  check(
    css.includes("[data-theme=light]") && css.includes("--ds-color-bg-input"),
    "styles.css contains the token variables for both themes",
  );
  const ownManifest: unknown = JSON.parse(
    readFileSync(
      join(app, "node_modules", "@aleixvidal", "ui", "package.json"),
      "utf8",
    ),
  );
  check(
    !JSON.stringify(ownManifest).includes("workspace:"),
    "the packed manifest has no workspace: dependency",
  );

  // 4. Serve the production build and look at it in a browser.
  const dist = join(app, "dist");
  const server = createServer((request, response) => {
    const path = request.url === "/" ? "/index.html" : (request.url ?? "/");
    try {
      const body = readFileSync(join(dist, path));
      const type = path.endsWith(".js")
        ? "text/javascript"
        : path.endsWith(".css")
          ? "text/css"
          : "text/html";
      response.writeHead(200, { "content-type": type }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  const { chromium } = await import(
    join(app, "node_modules", "playwright-core", "index.mjs")
  );
  const browser = await chromium.launch({
    channel: process.env.SMOKE_BROWSER_CHANNEL ?? "chrome",
  });
  try {
    const page = await browser.newPage();
    // The border transitions with `motion-safe`; measure the settled colors, not a frame in between.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.waitForSelector('[data-slot="input"]');

    /** What a token resolves to in the browser, so the comparison is between computed colors. */
    const resolved = (
      token: "border.control" | "bg.input",
      theme: "dark" | "light",
    ): Promise<string> =>
      page.evaluate(
        ([value]: [string]) => {
          const probe = document.createElement("span");
          probe.style.color = value;
          document.body.append(probe);
          const computed = getComputedStyle(probe).color;
          probe.remove();
          return computed;
        },
        [themeValues[theme][token]],
      );
    const painted = (): Promise<{
      border: string;
      background: string;
      height: string;
      radius: string;
      font: string;
    }> =>
      page.evaluate(() => {
        const box = document.querySelector('[data-slot="input"]');
        if (!box) throw new Error("input box not found");
        const style = getComputedStyle(box);
        return {
          border: style.borderTopColor,
          background: style.backgroundColor,
          height: style.height,
          radius: style.borderTopLeftRadius,
          font: getComputedStyle(box.querySelector("input") ?? box).fontFamily,
        };
      });

    const dark = await painted();
    check(
      dark.border === (await resolved("border.control", "dark")),
      "dark (default): the border is the border.control token",
    );
    check(
      dark.background === (await resolved("bg.input", "dark")),
      "dark (default): the background is the bg.input token",
    );
    check(dark.height === "40px", "the md size is 40px tall (spacing token)");
    check(dark.radius === "4px", "the radius is the radius.lg token (4px)");
    check(
      dark.font.includes("IBM Plex Mono"),
      "the font family is the font.mono token",
    );

    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "light"),
    );
    const light = await painted();
    check(
      light.border === (await resolved("border.control", "light")),
      'data-theme="light": the border is the light border.control',
    );
    check(
      light.background === (await resolved("bg.input", "light")),
      'data-theme="light": the background is the light bg.input',
    );
    check(
      light.border !== dark.border && light.background !== dark.background,
      "toggling data-theme changes the colors",
    );

    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "dark"),
    );
    const back = await painted();
    check(
      back.border === dark.border && back.background === dark.background,
      'data-theme="dark" restores the dark colors',
    );

    const page2 = await page.evaluate(() => {
      const heading = getComputedStyle(
        document.getElementById("heading") ?? document.body,
      );
      return {
        margin: getComputedStyle(document.body).marginTop,
        headingSize: heading.fontSize,
      };
    });
    check(
      page2.margin === "8px" && page2.headingSize === "32px",
      "the consumer's page is not reset (browser defaults for body margin and h1)",
    );
  } finally {
    await browser.close();
    server.close();
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nConsumer smoke test: OK");
}
