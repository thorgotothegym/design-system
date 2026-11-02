/**
 * Accessibility audit of the built Storybook: `node scripts/a11y-audit.mts <check> [options]`.
 *
 * The evidence behind docs/accessibility.md. It drives the stories with real keyboard and pointer
 * events in Playwright and reads what assistive technology reads: the accessibility tree (aria
 * snapshots), accessible names, focus, computed styles and box sizes. It never relies on class
 * names. It is not a test and not part of CI: it records observations, and a person decides what
 * they mean. It does not replace a screen reader (see the manual checklist in the report).
 *
 * Before running it, build the Storybook with the demo pace off, as CI does:
 *   STORYBOOK_PLAY_DELAY=0 pnpm exec turbo run build --filter=@aleixvidal/storybook --force
 *
 * Checks: keyboard, names, target, reflow, modes, known, input-purpose, otp, lang, cross-browser,
 * ssr, or `all` (everything except cross-browser). Options: --component <title fragment>,
 * --theme dark|light (default both), --out <file> (raw JSON results, default
 * ./a11y-audit-results.json), --evidence <dir> (where cited evidence is written, default
 * docs/accessibility). One browser runs at a time and is closed after each component, to keep
 * the load low.
 *
 * Plain Node (type stripping). Playwright comes from apps/storybook; no other dependency.
 */
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { extname, join, resolve } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const STATIC = join(ROOT, "apps/storybook/storybook-static");
const require = createRequire(join(ROOT, "apps/storybook/package.json"));
// Playwright's types are not resolvable from here; the API used below is small and stable.
const playwright = require("playwright") as {
  chromium: BrowserType;
  firefox: BrowserType;
  webkit: BrowserType;
};

type BrowserType = { launch: (o?: object) => Promise<Browser> };
type Browser = {
  newContext: (o?: object) => Promise<Context>;
  close: () => Promise<void>;
};
type Context = { newPage: () => Promise<Page>; close: () => Promise<void> };
// The Page API is used dynamically; typing all of it here would add nothing to the evidence.
type Page = Record<string, any>;

type Result = {
  check: string;
  component: string;
  story?: string;
  theme?: string;
  browser?: string;
  item: string;
  ok: boolean | null;
  detail: unknown;
};

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};
const check = args[0] ?? "all";
const onlyComponent = option("component");
const themes = option("theme")
  ? [option("theme") as string]
  : ["dark", "light"];
const outFile = resolve(option("out") ?? "a11y-audit-results.json");
const evidenceDir = resolve(
  option("evidence") ?? join(ROOT, "docs/accessibility"),
);

const results: Result[] = [];
const record = (r: Result) => {
  results.push(r);
  const mark = r.ok === null ? "info" : r.ok ? "PASS" : "FAIL";
  console.log(
    `${mark.padEnd(4)} ${r.check} ${r.component}${r.story ? `/${r.story}` : ""}${r.theme ? ` [${r.theme}]` : ""}${r.browser ? ` (${r.browser})` : ""}: ${r.item}`,
  );
};

// ---------------------------------------------------------------- static server for the build
const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const serve = () =>
  new Promise<{ url: string; close: () => void }>((done) => {
    const server = createServer((request, response) => {
      const path = decodeURIComponent((request.url ?? "/").split("?")[0]);
      let file = join(STATIC, path);
      if (existsSync(file) && statSync(file).isDirectory())
        file = join(file, "index.html");
      if (!file.startsWith(STATIC) || !existsSync(file)) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      });
      response.end(readFileSync(file));
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      done({ url: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });

// ---------------------------------------------------------------- browser and story helpers
let base = "";

/** Opens one browser, runs `run`, and always closes it: one browser at a time. */
const withBrowser = async <T,>(
  name: "chromium" | "firefox" | "webkit",
  contextOptions: object,
  run: (page: Page, logs: string[]) => Promise<T>,
) => {
  const browser = await playwright[name].launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1000, height: 800 },
      ...contextOptions,
    });
    const page = await context.newPage();
    const logs: string[] = [];
    page.on("console", (m: Page) => {
      if (["error", "warning"].includes(m.type()))
        logs.push(`${m.type()}: ${m.text()}`);
    });
    page.on("pageerror", (e: Error) => logs.push(`pageerror: ${e.message}`));
    return await run(page, logs);
  } finally {
    await browser.close();
  }
};

const storyId = (title: string, story: string) =>
  `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}--${story}`;

/** Loads a story in the preview iframe and waits for it to render and its play to settle. */
const open = async (
  page: Page,
  title: string,
  story: string,
  theme: string,
) => {
  await page.goto(
    `${base}/iframe.html?id=${storyId(title, story)}&viewMode=story&globals=theme:${theme}`,
    { waitUntil: "networkidle" },
  );
  await page.waitForSelector("#storybook-root > *", { timeout: 15000 });
  // Play functions run with STORYBOOK_PLAY_DELAY=0; give them and React a moment to settle.
  await page.waitForTimeout(700);
};

/** What has focus, described the way a person would: role, name and a data-slot hook. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return "(body)";
    const role = el.getAttribute("role") ?? el.tagName.toLowerCase();
    const label =
      el.getAttribute("aria-label") ??
      (el.getAttribute("aria-labelledby") ?? "")
        .split(" ")
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean)
        .join(" ") ??
      "";
    const slot = el.closest("[data-slot]")?.getAttribute("data-slot") ?? "";
    const text = (el as HTMLElement).innerText?.trim().slice(0, 30) ?? "";
    return `${role}${label ? ` "${label}"` : text ? ` "${text}"` : ""}${slot ? ` [${slot}]` : ""}`;
  });

/** Whether the focused element (or the box drawn around it) paints a visible indicator. */
const focusIndicator = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body)
      return { visible: false, by: "nothing focused" };
    const chain: HTMLElement[] = [];
    for (
      let n: HTMLElement | null = el;
      n && chain.length < 4;
      n = n.parentElement
    )
      chain.push(n);
    for (const n of chain) {
      const s = getComputedStyle(n);
      const outline =
        s.outlineStyle !== "none" &&
        parseFloat(s.outlineWidth) > 0 &&
        s.outlineColor !== "transparent" &&
        !/rgba\(\d+, \d+, \d+, 0\)/.test(s.outlineColor);
      const shadow = s.boxShadow !== "none";
      if (outline || shadow) {
        const box = n.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const top = document.elementFromPoint(cx, cy);
        const obscured = !!top && !n.contains(top) && !top.contains(n);
        return {
          visible: true,
          by: `${n === el ? "element" : "wrapper"} ${outline ? `outline ${s.outlineWidth} ${s.outlineStyle}` : "box-shadow"}`,
          obscured,
          coveredBy: obscured && top ? top.tagName.toLowerCase() : undefined,
        };
      }
    }
    // OtpInput: the <input> is transparent and the ring is drawn on the active box beside it.
    const active = el
      .closest("[data-slot=otp-input]")
      ?.querySelector("[data-active]") as HTMLElement | null;
    if (active) {
      const s = getComputedStyle(active);
      if (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0)
        return {
          visible: true,
          by: `active box outline ${s.outlineWidth} ${s.outlineStyle}`,
          obscured: false,
        };
    }
    return {
      visible: false,
      by: "no outline or shadow on the element or its 3 parents",
    };
  });

/** The accessibility tree of the story root (and of portaled popups when present). */
const tree = async (page: Page, scope = "#storybook-root") =>
  (await page.locator(scope).ariaSnapshot()) as string;

const saveEvidence = (name: string, content: string) => {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), content);
};

/** A small cropped JPEG of an element, width capped at 640 px with sips (macOS). */
const shot = async (page: Page, selector: string, name: string) => {
  mkdirSync(evidenceDir, { recursive: true });
  const file = join(evidenceDir, name);
  await page
    .locator(selector)
    .first()
    .screenshot({ path: file, type: "jpeg", quality: 60 });
  try {
    execFileSync(
      "sips",
      ["--resampleWidth", "640", "-s", "formatOptions", "60", file],
      {
        stdio: "ignore",
      },
    );
  } catch {
    // sips only exists on macOS; the screenshot is kept as Playwright wrote it.
  }
  return name;
};

// ---------------------------------------------------------------- what to audit
const press = (page: Page, key: string) =>
  page.keyboard.press(key, { delay: 80 });

/** Each component, the story its keyboard scenario starts from, and the stories whose states are read. */
type Component = {
  title: string;
  start: string;
  states: string[];
  /** Real key presses from the first Tab into the story; each step records focus and state. */
  keys: { key: string; expect?: string }[];
  /** A short description of the state read after each step (value, checked, expanded...). */
  state?: (page: Page) => Promise<string>;
};

const valueOf = (selector: string) => (page: Page) =>
  page.evaluate((sel: string) => {
    const el = document.querySelector(sel) as HTMLInputElement | null;
    if (!el) return "(none)";
    const a = (n: string) => el.getAttribute(n);
    return [
      a("aria-checked") && `checked=${a("aria-checked")}`,
      a("aria-expanded") && `expanded=${a("aria-expanded")}`,
      a("aria-valuenow") && `valuenow=${a("aria-valuenow")}`,
      a("aria-valuetext") && `valuetext=${a("aria-valuetext")}`,
      "value" in el && el.value !== undefined && `value="${el.value}"`,
      !("value" in el) && `text="${el.textContent?.trim().slice(0, 30)}"`,
    ]
      .filter(Boolean)
      .join(" ");
  }, selector);

const COMPONENTS: Component[] = [
  {
    title: "Form components/Input",
    start: "default",
    states: [
      "default",
      "disabled",
      "read-only",
      "invalid",
      "loading",
      "with-prefix-and-suffix",
      "validation-flow",
    ],
    keys: [{ key: "Tab" }, { key: "a" }, { key: "b" }, { key: "Tab" }],
    state: valueOf("input"),
  },
  {
    title: "Form components/Textarea",
    start: "default",
    states: [
      "default",
      "disabled",
      "read-only",
      "invalid",
      "auto-grow",
      "validation-flow",
    ],
    keys: [
      { key: "Tab" },
      { key: "a" },
      { key: "Enter" },
      { key: "b" },
      { key: "Tab" },
    ],
    state: valueOf("textarea"),
  },
  {
    title: "Form components/Field",
    start: "with-description",
    states: [
      "default",
      "with-description",
      "required",
      "with-error",
      "disabled",
      "horizontal-with-error",
      "validation-flow",
    ],
    keys: [{ key: "Tab" }, { key: "Tab" }],
  },
  {
    title: "Form components/Checkbox",
    start: "with-label-and-description",
    states: [
      "default",
      "checked",
      "indeterminate",
      "disabled",
      "invalid",
      "with-label-and-description",
      "group",
    ],
    keys: [{ key: "Tab" }, { key: "Space" }, { key: "Space" }, { key: "Tab" }],
    state: valueOf("[role=checkbox]"),
  },
  {
    title: "Form components/Switch",
    start: "with-label-and-description",
    states: [
      "default",
      "on",
      "disabled",
      "invalid",
      "with-label-and-description",
    ],
    keys: [{ key: "Tab" }, { key: "Space" }, { key: "Enter" }, { key: "Tab" }],
    state: valueOf("[role=switch]"),
  },
  {
    title: "Form components/RadioGroup",
    start: "default",
    states: [
      "default",
      "selected",
      "horizontal",
      "disabled-option",
      "disabled",
      "invalid",
    ],
    keys: [
      { key: "Tab" },
      { key: "ArrowDown" },
      { key: "ArrowDown" },
      { key: "ArrowUp" },
      { key: "Tab" },
    ],
    state: (page) =>
      page.evaluate(() => {
        const checked = document.querySelector(
          "[role=radio][aria-checked=true]",
        );
        return `checked="${checked?.closest("[data-slot=field]")?.textContent?.trim().slice(0, 25) ?? checked?.getAttribute("value") ?? "(none)"}"`;
      }),
  },
  {
    title: "Form components/Select",
    start: "default",
    states: [
      "default",
      "with-value",
      "grouped",
      "disabled-option",
      "disabled",
      "invalid",
      "optional",
    ],
    keys: [
      { key: "Tab" },
      { key: "Enter" },
      { key: "ArrowDown" },
      { key: "End" },
      { key: "Home" },
      { key: "Escape" },
      { key: "Space" },
      { key: "ArrowDown" },
      { key: "Enter" },
      { key: "s" },
      { key: "Tab" },
    ],
    state: valueOf("[role=combobox]"),
  },
  {
    title: "Form components/Slider",
    start: "range",
    states: [
      "default",
      "range",
      "with-value",
      "disabled",
      "invalid",
      "with-field",
    ],
    keys: [
      { key: "Tab" },
      { key: "ArrowRight" },
      { key: "PageUp" },
      { key: "Home" },
      { key: "End" },
      { key: "Tab" },
      { key: "ArrowLeft" },
      { key: "Tab" },
    ],
    state: (page) =>
      page.evaluate(() =>
        [...document.querySelectorAll("[role=slider]")]
          .map(
            (s) =>
              `${s.getAttribute("aria-valuenow")}${s.getAttribute("aria-valuetext") ? `(${s.getAttribute("aria-valuetext")})` : ""}`,
          )
          .join(","),
      ),
  },
  {
    title: "Form components/TagInput",
    start: "default",
    states: [
      "default",
      "with-value",
      "disabled",
      "read-only",
      "invalid",
      "with-field",
    ],
    keys: [
      { key: "Tab" },
      { key: "r" },
      { key: "Enter" },
      { key: "c" },
      { key: "Comma" },
      { key: "Shift+Tab" },
      { key: "ArrowRight" },
      { key: "Delete" },
      { key: "Tab" },
      { key: "Backspace" },
      { key: "Tab" },
    ],
    state: (page) =>
      page.evaluate(
        () =>
          `tags=[${[...document.querySelectorAll("[data-slot=tag-input-tag]")].map((t) => t.textContent?.trim()).join(",")}] status="${document.querySelector("[data-slot=tag-input-status]")?.textContent?.trim() ?? ""}"`,
      ),
  },
  {
    title: "Form components/OtpInput",
    start: "default",
    states: [
      "default",
      "with-value",
      "disabled",
      "read-only",
      "invalid",
      "grouped",
    ],
    keys: [
      { key: "Tab" },
      { key: "1" },
      { key: "2" },
      { key: "Backspace" },
      { key: "Tab" },
    ],
    state: valueOf("input"),
  },
  {
    title: "Form components/DatePicker",
    start: "with-value",
    states: [
      "default",
      "with-value",
      "in-field",
      "disabled",
      "read-only",
      "invalid",
      "required",
      "calendar-states",
    ],
    keys: [
      { key: "Tab" },
      { key: "Tab" },
      { key: "Tab" },
      { key: "Enter" },
      { key: "ArrowRight" },
      { key: "ArrowDown" },
      { key: "PageDown" },
      { key: "Escape" },
      { key: "Shift+Tab" },
      { key: "Alt+ArrowDown" },
      { key: "Enter" },
      { key: "Tab" },
    ],
    state: (page) =>
      page.evaluate(() => {
        const dialog = document.querySelector("[role=dialog]");
        const value = [
          ...document.querySelectorAll("[data-slot=date-picker-segment]"),
        ]
          .map((s) => s.textContent)
          .join("");
        return `field="${value}" dialog=${dialog ? "open" : "closed"}`;
      }),
  },
  {
    title: "Patterns/Realistic form",
    start: "default",
    states: [
      "default",
      "with-errors",
      "server-error",
      "success",
      "disabled",
      "read-only",
    ],
    // The Tab order through the whole form, then back out.
    keys: Array.from({ length: 24 }, () => ({ key: "Tab" })),
  },
];

const selected = COMPONENTS.filter(
  (c) =>
    !onlyComponent ||
    c.title.toLowerCase().includes(onlyComponent.toLowerCase()),
);
const short = (title: string) => title.split("/").pop() as string;

// ---------------------------------------------------------------- 1. keyboard
const keyboard = async () => {
  for (const c of selected) {
    for (const theme of themes) {
      await withBrowser("chromium", {}, async (page, logs) => {
        await open(page, c.title, c.start, theme);
        await page.locator("body").click({ position: { x: 1, y: 1 } });
        // Where focus is before the first key. A click on the page can already move it (DatePicker).
        const steps: unknown[] = [
          {
            key: "(start)",
            focus: await focused(page),
            indicator: await focusIndicator(page),
            state: c.state ? await c.state(page) : "",
          },
        ];
        let trapped = false;
        const seen: string[] = [];
        for (const step of c.keys) {
          await press(page, step.key);
          await page.waitForTimeout(150);
          const now = await focused(page);
          const indicator = await focusIndicator(page);
          const state = c.state ? await c.state(page) : "";
          steps.push({ key: step.key, focus: now, indicator, state });
          seen.push(now);
        }
        // A trap: the last Tabs keep landing on the same element.
        if (c.keys.length > 3 && c.keys.at(-1)?.key === "Tab") {
          const last = seen.slice(-3);
          trapped = last.every((f) => f === last[0]) && last[0] !== "(body)";
        }
        const indicatorsMissing = (
          steps as {
            key: string;
            focus: string;
            indicator: { visible: boolean };
          }[]
        )
          .filter(
            (s) =>
              s.key !== "(start)" &&
              s.focus !== "(body)" &&
              !s.indicator.visible,
          )
          .map((s) => s.focus);
        const obscured = (
          steps as { focus: string; indicator: { obscured?: boolean } }[]
        )
          .filter((s) => s.indicator.obscured)
          .map((s) => s.focus);
        record({
          check: "keyboard",
          component: short(c.title),
          story: c.start,
          theme,
          item: "steps",
          ok: null,
          detail: steps,
        });
        record({
          check: "keyboard",
          component: short(c.title),
          story: c.start,
          theme,
          item: "no keyboard trap",
          ok: !trapped,
          detail: seen,
        });
        record({
          check: "keyboard",
          component: short(c.title),
          story: c.start,
          theme,
          item: "focus indicator on every focused stop",
          ok: indicatorsMissing.length === 0,
          detail: indicatorsMissing,
        });
        record({
          check: "keyboard",
          component: short(c.title),
          story: c.start,
          theme,
          item: "focused element not obscured",
          ok: obscured.length === 0,
          detail: obscured,
        });
        record({
          check: "keyboard",
          component: short(c.title),
          story: c.start,
          theme,
          item: "console clean",
          ok: logs.length === 0,
          detail: logs,
        });
      });
    }
  }
};

// ---------------------------------------------------------------- 2. names, roles, states; 11. label in name; 9. input purpose
const CONTROLS =
  "input:not([type=hidden]), textarea, button, select, [role=checkbox], [role=switch], [role=radio], [role=radiogroup], [role=slider], [role=combobox], [role=spinbutton], [role=group], [role=listbox], [role=option], [role=gridcell] [role=button]";

/** Every visible control with its states from the DOM and its name from the accessibility tree. */
const controls = async (page: Page) => {
  const list = (await page.evaluate((selector: string) => {
    const visible = (el: Element) => {
      if (el.closest("[aria-hidden=true]")) return false;
      const s = getComputedStyle(el);
      if (s.visibility === "hidden") return false;
      // Visually hidden for screen readers (clip or clip-path on it or an ancestor): not a pointer target.
      for (let n: Element | null = el; n; n = n.parentElement) {
        const c = getComputedStyle(n);
        if (
          (c.clip && c.clip !== "auto") ||
          (c.clipPath && c.clipPath !== "none")
        )
          return false;
      }
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };
    return [...document.querySelectorAll(selector)]
      .filter(visible)
      .map((el, index) => {
        el.setAttribute("data-audit-index", String(index));
        const a = (n: string) => el.getAttribute(n);
        const describedby = (a("aria-describedby") ?? "")
          .split(" ")
          .filter(Boolean)
          .map((id) => ({
            id,
            exists: !!document.getElementById(id),
            text: document.getElementById(id)?.textContent?.trim() ?? null,
          }));
        const labelledby = (a("aria-labelledby") ?? "")
          .split(" ")
          .filter(Boolean)
          .map((id) => document.getElementById(id))
          // A control often lists itself or its own parts (date segments); only outside labels count.
          .filter(
            (target) => target && !el.contains(target) && !target.contains(el),
          )
          .map((target) => (target as HTMLElement).innerText?.trim() ?? "");
        const own = (el as HTMLInputElement).labels
          ? [...((el as HTMLInputElement).labels ?? [])].map((l) =>
              l.innerText.trim(),
            )
          : [];
        const fieldLabel = el
          .closest("[data-slot=field]")
          ?.querySelector("[data-slot=field-label]") as HTMLElement | null;
        // A button with its own text or aria-label (a tag's remove button) is named by that, not by the Field.
        const ownName =
          el.tagName === "BUTTON" &&
          (a("aria-label") || (el as HTMLElement).innerText.trim());
        const visibleLabel = ownName
          ? ""
          : fieldLabel?.innerText.trim() ||
            [...own, ...labelledby].join(" ").trim();
        const box = el.getBoundingClientRect();
        return {
          index,
          tag: el.tagName.toLowerCase(),
          role: a("role") ?? el.tagName.toLowerCase(),
          type: a("type"),
          visibleLabel,
          visibleText: (el as HTMLElement).innerText?.trim().slice(0, 40) ?? "",
          states: {
            invalid: a("aria-invalid"),
            required:
              a("aria-required") ?? (a("required") !== null ? "native" : null),
            readonly:
              a("aria-readonly") ?? (a("readonly") !== null ? "native" : null),
            disabled:
              a("aria-disabled") ??
              ((el as HTMLButtonElement).disabled ? "native" : null),
            checked: a("aria-checked"),
            expanded: a("aria-expanded"),
            selected: a("aria-selected"),
            valuenow: a("aria-valuenow"),
            valuetext: a("aria-valuetext"),
          },
          describedby,
          autocomplete: a("autocomplete"),
          size: {
            width: Math.round(box.width * 10) / 10,
            height: Math.round(box.height * 10) / 10,
          },
          center: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
        };
      });
  }, CONTROLS)) as {
    index: number;
    role: string;
    tag: string;
    visibleLabel: string;
    visibleText: string;
    states: Record<string, string | null>;
    describedby: { id: string; exists: boolean; text: string | null }[];
    autocomplete: string | null;
    size: { width: number; height: number };
    center: { x: number; y: number };
  }[];
  for (const item of list) {
    const snapshot = (await page
      .locator(`[data-audit-index="${item.index}"]`)
      .ariaSnapshot()
      .catch(() => "")) as string;
    const name = snapshot.match(/^- [\w-]+ "((?:[^"\\]|\\.)*)"/m)?.[1] ?? "";
    Object.assign(item, { snapshot: snapshot.split("\n")[0], name });
  }
  return list as ((typeof list)[number] & { snapshot: string; name: string })[];
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[*:()]/g, " ")
    .replace(/\(optional\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const names = async () => {
  for (const c of selected) {
    await withBrowser("chromium", {}, async (page, logs) => {
      for (const story of c.states) {
        await open(page, c.title, story, "dark");
        const snapshot = await tree(page);
        const list = await controls(page);
        const brokenDescriptions = list.flatMap((x) =>
          x.describedby
            .filter((d) => !d.exists)
            .map((d) => `${x.name}: ${d.id}`),
        );
        const unnamed = list
          .filter((x) => !x.name && !["group", "listbox"].includes(x.role))
          .map((x) => x.snapshot || x.tag);
        // 2.5.3 Label in name: the accessible name contains the visible label text.
        const mismatches = list
          .filter((x) => x.visibleLabel && x.name)
          .filter((x) => !normalize(x.name).includes(normalize(x.visibleLabel)))
          .map((x) => ({
            visible: x.visibleLabel,
            name: x.name,
            role: x.role,
          }));
        record({
          check: "names",
          component: short(c.title),
          story,
          theme: "dark",
          item: "aria snapshot",
          ok: null,
          detail: snapshot,
        });
        record({
          check: "names",
          component: short(c.title),
          story,
          theme: "dark",
          item: "controls (name, states, description)",
          ok: null,
          detail: list,
        });
        record({
          check: "names",
          component: short(c.title),
          story,
          theme: "dark",
          item: "every control has a name",
          ok: unnamed.length === 0,
          detail: unnamed,
        });
        record({
          check: "names",
          component: short(c.title),
          story,
          theme: "dark",
          item: "aria-describedby targets exist",
          ok: brokenDescriptions.length === 0,
          detail: brokenDescriptions,
        });
        record({
          check: "label-in-name",
          component: short(c.title),
          story,
          theme: "dark",
          item: "accessible name contains the visible label (2.5.3)",
          ok: mismatches.length === 0,
          detail: mismatches,
        });
      }
      record({
        check: "names",
        component: short(c.title),
        item: "console clean",
        ok: logs.length === 0,
        detail: logs,
      });
    });
  }
};

// ---------------------------------------------------------------- 3. target size (2.5.8), dragging (2.5.7)
const target = async () => {
  for (const c of selected) {
    await withBrowser("chromium", {}, async (page) => {
      const story = c.title.includes("Checkbox")
        ? "with-label-and-description"
        : c.title.includes("DatePicker")
          ? "calendar-states"
          : c.start;
      await open(page, c.title, story, "dark");
      const list = await controls(page);
      const small = list.filter((x) => x.size.width < 24 || x.size.height < 24);
      // Spacing exception: a 24 px circle centred on a small target must not meet another target.
      const withSpacing = small.map((x) => {
        const nearest = list
          .filter(
            (o) =>
              o !== x && !["group", "radiogroup", "listbox"].includes(o.role),
          )
          .map((o) => {
            const dx = Math.max(
              0,
              Math.abs(o.center.x - x.center.x) - o.size.width / 2,
            );
            const dy = Math.max(
              0,
              Math.abs(o.center.y - x.center.y) - o.size.height / 2,
            );
            return Math.hypot(dx, dy);
          })
          .sort((a, b) => a - b)[0];
        return {
          control: x.snapshot || x.tag,
          size: x.size,
          nearestOtherTargetPx: Math.round((nearest ?? 999) * 10) / 10,
          spacingOk: (nearest ?? 999) >= 12,
        };
      });
      record({
        check: "target",
        component: short(c.title),
        story,
        item: "targets under 24x24 CSS px",
        ok: withSpacing.every((s) => s.spacingOk),
        detail: {
          all: list.map((x) => ({
            control: x.snapshot || x.tag,
            size: x.size,
          })),
          small: withSpacing,
        },
      });
      if (c.title.includes("Checkbox")) {
        const label = page.locator("[data-slot=field-label]").first();
        const box = await label.boundingBox();
        const before = await page
          .locator("[role=checkbox]")
          .first()
          .getAttribute("aria-checked");
        await label.click();
        const after = await page
          .locator("[role=checkbox]")
          .first()
          .getAttribute("aria-checked");
        record({
          check: "target",
          component: "Checkbox",
          story,
          item: "clicking the label toggles the 20 px box",
          ok: before !== after,
          detail: { labelBox: box, before, after },
        });
      }
      if (c.title.includes("Slider")) {
        await open(page, c.title, "default", "dark");
        const thumb = page.locator("[role=slider]").first();
        const before = await thumb.getAttribute("aria-valuenow");
        const track = await page
          .locator("[data-slot=slider-track]")
          .first()
          .boundingBox();
        await page.mouse.click(
          track.x + track.width * 0.8,
          track.y + track.height / 2,
        );
        const after = await thumb.getAttribute("aria-valuenow");
        record({
          check: "target",
          component: "Slider",
          story: "default",
          item: "a single click on the track moves the thumb (2.5.7)",
          ok: before !== after,
          detail: { before, after },
        });
      }
    });
  }
};

// ---------------------------------------------------------------- 4. reflow, text resize, text spacing
const TEXT_SPACING =
  "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }";

const overflow = (page: Page) =>
  page.evaluate(() => {
    const doc = document.scrollingElement as HTMLElement;
    const clipped = [...document.querySelectorAll("#storybook-root *")]
      .filter((el) => {
        const s = getComputedStyle(el);
        if (el.closest(".sr-only") || (el as HTMLElement).offsetParent === null)
          return false;
        const hidden =
          ["hidden", "clip"].includes(s.overflowX) ||
          ["hidden", "clip"].includes(s.overflowY);
        const e = el as HTMLElement;
        return (
          hidden &&
          (e.scrollWidth > e.clientWidth + 1 ||
            e.scrollHeight > e.clientHeight + 1) &&
          e.innerText?.trim()
        );
      })
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}${el.getAttribute("data-slot") ? `[${el.getAttribute("data-slot")}]` : ""} "${(el as HTMLElement).innerText.trim().slice(0, 30)}"`,
      );
    return {
      horizontalScroll: doc.scrollWidth > doc.clientWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      clipped,
    };
  });

const reflow = async () => {
  for (const c of selected) {
    const story = c.title.includes("Realistic")
      ? "with-errors"
      : (c.states.find(
          (s) => s.includes("field") || s === "with-description",
        ) ?? c.start);
    for (const mode of ["320px", "text 200%", "text spacing"]) {
      await withBrowser(
        "chromium",
        mode === "320px" ? { viewport: { width: 320, height: 640 } } : {},
        async (page) => {
          await open(page, c.title, story, "dark");
          if (mode === "text 200%")
            await page.evaluate(
              () => (document.documentElement.style.fontSize = "200%"),
            );
          if (mode === "text spacing")
            await page.addStyleTag({ content: TEXT_SPACING });
          await page.waitForTimeout(200);
          const result = await overflow(page);
          record({
            check: "reflow",
            component: short(c.title),
            story,
            item: mode,
            ok: !result.horizontalScroll && result.clipped.length === 0,
            detail: result,
          });
          if (c.title.includes("Realistic")) {
            const file = `reflow-realistic-form-${mode.replace(/[^a-z0-9]+/g, "-")}.jpg`;
            await shot(page, "#storybook-root", file);
          }
        },
      );
    }
  }
};

// ---------------------------------------------------------------- 5. forced colors, reduced motion, more contrast
const modes = async () => {
  const visual: [string, string, string][] = [
    ["Form components/Checkbox", "checked", "forced-checkbox-checked.jpg"],
    ["Form components/Switch", "on", "forced-switch-on.jpg"],
    ["Form components/RadioGroup", "selected", "forced-radio-selected.jpg"],
    [
      "Form components/DatePicker",
      "calendar-states",
      "forced-datepicker-calendar.jpg",
    ],
    ["Form components/Slider", "with-value", "forced-slider.jpg"],
  ];
  for (const c of selected) {
    await withBrowser(
      "chromium",
      { forcedColors: "active", reducedMotion: "reduce" },
      async (page, logs) => {
        await open(page, c.title, c.start, "dark");
        await page.locator("body").click({ position: { x: 1, y: 1 } });
        await press(page, "Tab");
        await page.waitForTimeout(150);
        const indicator = await focusIndicator(page);
        const borders = await page.evaluate(() =>
          [...document.querySelectorAll("[data-slot]")]
            .filter((el) =>
              [
                "input",
                "textarea",
                "select",
                "checkbox",
                "switch",
                "radio-group-item",
                "date-picker-field",
                "otp-input-slot",
                "tag-input",
                "slider-track",
              ].includes(el.getAttribute("data-slot") ?? ""),
            )
            .map((el) => {
              const s = getComputedStyle(el);
              return {
                slot: el.getAttribute("data-slot"),
                border: `${s.borderTopWidth} ${s.borderTopStyle}`,
                borderColor: s.borderTopColor,
              };
            }),
        );
        const running = await page.evaluate(() =>
          document
            .getAnimations()
            .map(
              (a) =>
                `${a.constructor.name} ${(a as CSSTransition).transitionProperty ?? (a as CSSAnimation).animationName ?? ""}`,
            ),
        );
        record({
          check: "modes",
          component: short(c.title),
          story: c.start,
          item: "forced colors: focus indicator painted",
          ok: indicator.visible,
          detail: indicator,
        });
        record({
          check: "modes",
          component: short(c.title),
          story: c.start,
          item: "forced colors: control boundaries",
          ok: borders.every(
            (b) => !b.border.includes("none") && !b.border.startsWith("0px"),
          ),
          detail: borders,
        });
        record({
          check: "modes",
          component: short(c.title),
          story: c.start,
          item: "reduced motion: no animation or transition running after focus",
          ok: running.length === 0,
          detail: running,
        });
        record({
          check: "modes",
          component: short(c.title),
          item: "console clean",
          ok: logs.length === 0,
          detail: logs,
        });
        for (const [title, story, file] of visual.filter(
          ([t]) => t === c.title,
        )) {
          await open(page, title, story, "dark");
          await shot(
            page,
            (await page.locator("[role=dialog]").count())
              ? "[role=dialog]"
              : "#storybook-root",
            file,
          );
          record({
            check: "modes",
            component: short(c.title),
            story,
            item: `forced colors screenshot ${file}`,
            ok: null,
            detail: file,
          });
        }
      },
    );
  }
  const css = readFileSync(join(ROOT, "packages/ui/dist/styles.css"), "utf8");
  record({
    check: "modes",
    component: "all",
    item: "prefers-contrast rules in styles.css",
    ok: null,
    detail: {
      prefersContrast: css.includes("prefers-contrast"),
      forcedColors: css.includes("forced-colors"),
      reducedMotion: css.includes("prefers-reduced-motion"),
    },
  });
};

// ---------------------------------------------------------------- 6. known items
const known = async () => {
  await withBrowser("chromium", {}, async (page) => {
    // Label click on controls a <label for> cannot label.
    for (const [title, story] of [
      ["Form components/Slider", "with-field"],
      ["Form components/RadioGroup", "default"],
      ["Form components/DatePicker", "in-field"],
    ]) {
      await open(page, title, story, "dark");
      await page.locator("[data-slot=field-label]").first().click();
      record({
        check: "known",
        component: short(title),
        story,
        item: "clicking the Field.Label",
        ok: null,
        detail: { focusAfterClick: await focused(page) },
      });
    }

    // Partially filled DatePicker: is anything marked invalid?
    await open(page, "Form components/DatePicker", "controlled", "dark");
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    await press(page, "Tab");
    for (const k of ["Backspace", "Backspace"]) await press(page, k);
    await press(page, "Tab");
    await press(page, "Tab");
    await press(page, "Tab");
    await press(page, "Tab");
    const partial = await page.evaluate(() => ({
      segments: [
        ...document.querySelectorAll("[data-slot=date-picker-segment]"),
      ]
        .map(
          (s) =>
            `${s.textContent}${s.getAttribute("data-placeholder") !== null ? "(placeholder)" : ""}`,
        )
        .join(""),
      groupInvalid:
        document
          .querySelector("[data-slot=date-picker-field]")
          ?.getAttribute("aria-invalid") ?? null,
      anySegmentInvalid: [
        ...document.querySelectorAll("[data-slot=date-picker-segment]"),
      ].some((s) => s.getAttribute("aria-invalid") === "true"),
      reported:
        document.querySelector("#storybook-root p")?.textContent ?? null,
    }));
    record({
      check: "known",
      component: "DatePicker",
      story: "controlled",
      item: "partially cleared date: invalid indicator?",
      ok: null,
      detail: partial,
    });
    await shot(page, "#storybook-root", "datepicker-partial.jpg");

    // aria-hidden-focus in the open Select and DatePicker: reachable or not?
    const axePath = require.resolve("axe-core/axe.min.js", {
      paths: [join(ROOT, "apps/storybook"), join(ROOT, "packages/ui")],
    });
    for (const [title, story, open1] of [
      ["Form components/Select", "default", "select"],
      ["Form components/DatePicker", "calendar-states", "date"],
    ]) {
      await open(page, title, story, "dark");
      if (open1 === "select") {
        await page.locator("body").click({ position: { x: 1, y: 1 } });
        await press(page, "Tab");
        await press(page, "Enter");
        await page.waitForSelector("[role=listbox]");
      } else {
        await page.waitForSelector("[role=dialog]");
      }
      await page.addScriptTag({ path: axePath });
      const axe = await page.evaluate(async () => {
        // axe is injected above; it adds itself to window.
        const r = await (
          window as unknown as {
            axe: {
              run: (
                c: object,
                o: object,
              ) => Promise<{
                violations: { id: string; nodes: { target: string[] }[] }[];
              }>;
            };
          }
        ).axe.run(document, { runOnly: ["aria-hidden-focus"] });
        return r.violations.flatMap((v) =>
          v.nodes.map((n) => n.target.join(" ")),
        );
      });
      const reached: string[] = [];
      for (let i = 0; i < 8; i++) {
        await press(page, i % 2 ? "Shift+Tab" : "Tab");
        reached.push(await focused(page));
      }
      const leaked = await page.evaluate(
        () => !!document.activeElement?.closest("[aria-hidden=true]"),
      );
      record({
        check: "known",
        component: short(title),
        story,
        item: "aria-hidden-focus: flagged nodes vs where Tab and Shift+Tab can go",
        ok: !leaked,
        detail: {
          axeFlagged: axe,
          focusStopsWhileOpen: [...new Set(reached)],
          focusEverInsideAriaHidden: leaked,
        },
      });
    }
  });
};

// ---------------------------------------------------------------- 9. input purpose, 10. OTP, 14. lang
const inputPurpose = async () => {
  await withBrowser("chromium", {}, async (page) => {
    await open(page, "Patterns/Realistic form", "default", "dark");
    const list = await controls(page);
    record({
      check: "input-purpose",
      component: "Realistic form",
      story: "default",
      item: "autocomplete per control (1.3.5)",
      ok: null,
      detail: list
        .filter(
          (x) =>
            ["input", "textarea", "combobox", "spinbutton", "button"].includes(
              x.role,
            ) || x.tag === "input",
        )
        .map((x) => ({
          name: x.name,
          role: x.role,
          autocomplete: x.autocomplete,
        })),
    });
    const hidden = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          "select, input[type=hidden], input[aria-hidden=true]",
        ),
      ].map((el) => ({
        tag: el.tagName.toLowerCase(),
        name: el.getAttribute("name"),
        autocomplete: el.getAttribute("autocomplete"),
      })),
    );
    record({
      check: "input-purpose",
      component: "Realistic form",
      story: "default",
      item: "form-associated hidden controls",
      ok: null,
      detail: hidden,
    });
  });
};

const otp = async () => {
  await withBrowser(
    "chromium",
    { permissions: ["clipboard-read", "clipboard-write"] },
    async (page) => {
      for (const code of ["482913", "482 913"]) {
        await open(page, "Form components/OtpInput", "default", "dark");
        const attrs = await page.evaluate(() => {
          const input = document.querySelector(
            "[data-slot=otp-input] input",
          ) as HTMLInputElement | null;
          return {
            autocomplete: input?.getAttribute("autocomplete"),
            inputmode: input?.getAttribute("inputmode"),
            maxlength: input?.getAttribute("maxlength"),
            type: input?.type,
          };
        });
        await page.evaluate(
          (text: string) => navigator.clipboard.writeText(text),
          code,
        );
        await page.locator("[data-slot=otp-input] input").focus();
        await page.keyboard.press(
          process.platform === "darwin" ? "Meta+V" : "Control+V",
        );
        await page.waitForTimeout(200);
        const value = await page
          .locator("[data-slot=otp-input] input")
          .inputValue();
        record({
          check: "otp",
          component: "OtpInput",
          story: "default",
          item: `paste "${code}" (3.3.8)`,
          ok: value === "482913",
          detail: { attrs, valueAfterPaste: value },
        });
      }
    },
  );
};

const lang = async () => {
  for (const path of ["index.html", "iframe.html"]) {
    const html = readFileSync(join(STATIC, path), "utf8");
    record({
      check: "lang",
      component: "Storybook site",
      item: `${path} <html lang> (3.1.1)`,
      ok: /<html[^>]*lang="en"/.test(html),
      detail: html.match(/<html[^>]*>/)?.[0],
    });
  }
  await withBrowser("chromium", {}, async (page) => {
    await open(page, "Form components/DatePicker", "spanish-calendar", "dark");
    const langs = await page.evaluate(() =>
      [...document.querySelectorAll("[lang]")].map(
        (el) => `${el.tagName.toLowerCase()} lang=${el.getAttribute("lang")}`,
      ),
    );
    record({
      check: "lang",
      component: "DatePicker",
      story: "spanish-calendar",
      item: "lang on Spanish content (3.1.2, observation)",
      ok: null,
      detail: langs,
    });
  });
};

// ---------------------------------------------------------------- 7. cross-browser
const crossBrowser = async () => {
  for (const name of ["chromium", "firefox", "webkit"] as const) {
    await withBrowser(name, {}, async (page, logs) => {
      await open(page, "Form components/Textarea", "auto-grow", "dark");
      const area = page.locator("textarea").first();
      const before = (await area.boundingBox()).height;
      await area.click();
      for (let i = 0; i < 6; i++) await page.keyboard.press("Enter");
      await page.keyboard.type("last line");
      await page.waitForTimeout(200);
      const after = (await area.boundingBox()).height;
      record({
        check: "cross-browser",
        component: "Textarea",
        story: "auto-grow",
        browser: name,
        item: "autoGrow follows the text",
        ok: after > before,
        detail: { before, after },
      });
    });
    await withBrowser(name, {}, async (page, logs) => {
      await open(page, "Patterns/Realistic form", "default", "dark");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      const order: string[] = [];
      for (let i = 0; i < 14; i++) {
        await press(page, "Tab");
        order.push(await focused(page));
      }
      record({
        check: "cross-browser",
        component: "Realistic form",
        story: "default",
        browser: name,
        item: "Tab order",
        ok: null,
        detail: order,
      });
      await shot(page, "#storybook-root", `cross-browser-form-${name}.jpg`);
      record({
        check: "cross-browser",
        component: "Realistic form",
        story: "default",
        browser: name,
        item: "console clean",
        ok: logs.length === 0,
        detail: logs,
      });
    });
    await withBrowser(name, {}, async (page) => {
      await open(page, "Form components/Select", "default", "dark");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      // Safari (and WebKit) only tab to text fields by default; Option+Tab reaches every control.
      await press(page, name === "webkit" ? "Alt+Tab" : "Tab");
      await press(page, "Enter");
      await page.waitForTimeout(300);
      const opened = await page.locator("[role=listbox]").count();
      await press(page, "Escape");
      await page.waitForTimeout(300);
      record({
        check: "cross-browser",
        component: "Select",
        story: "default",
        browser: name,
        item: "Enter opens, Escape closes and returns focus",
        ok: opened === 1 && (await focused(page)).startsWith("combobox"),
        detail: { opened, focusAfterEscape: await focused(page) },
      });
    });
    await withBrowser(name, {}, async (page) => {
      await open(page, "Form components/DatePicker", "with-value", "dark");
      await page.locator("body").click({ position: { x: 1, y: 1 } });
      await press(page, "Tab");
      await press(page, "Alt+ArrowDown");
      await page.waitForTimeout(400);
      const opened = await page.locator("[role=dialog]").count();
      const inGrid = await focused(page);
      await press(page, "Escape");
      await page.waitForTimeout(300);
      record({
        check: "cross-browser",
        component: "DatePicker",
        story: "with-value",
        browser: name,
        item: "Alt+Down opens the calendar on the day, Escape returns focus",
        ok: opened === 1,
        detail: {
          opened,
          focusInCalendar: inGrid,
          focusAfterEscape: await focused(page),
        },
      });
    });
  }
};

// ---------------------------------------------------------------- 8. server render
const ssr = async () => {
  const req = createRequire(join(ROOT, "packages/ui/package.json"));
  const React = req("react");
  const { renderToString } = req("react-dom/server");
  const ui = await import(join(ROOT, "packages/ui/dist/index.js"));
  const h = React.createElement;
  const html = renderToString(
    h(
      ui.Field,
      { required: true },
      h(ui.Field.Label, null, "Email"),
      h(ui.Field.Description, null, "We send your ticket here."),
      h(ui.Input, null),
      h(ui.Field.Error, null),
    ),
  );
  const input = html.match(/<input[^>]*>/)?.[0] ?? "";
  record({
    check: "ssr",
    component: "Field",
    item: "server HTML: aria-describedby on the control before hydration",
    ok: input.includes("aria-describedby"),
    detail: { input, html },
  });
  const switchHtml = renderToString(
    h(
      ui.Field,
      { required: true, orientation: "horizontal" },
      h(ui.Switch, null),
      h(ui.Field.Label, null, "Email notifications"),
    ),
  );
  record({
    check: "ssr",
    component: "Switch",
    item: "Field required around a Switch: marker in the label, aria-required on the switch",
    ok: null,
    detail: {
      label: switchHtml.match(/<label[^>]*>.*?<\/label>/)?.[0],
      switch: switchHtml.match(/<button[^>]*role="switch"[^>]*>/)?.[0],
    },
  });
};

// ---------------------------------------------------------------- main
const CHECKS: Record<string, () => Promise<void>> = {
  keyboard,
  names,
  target,
  reflow,
  modes,
  known,
  "input-purpose": inputPurpose,
  otp,
  lang,
  "cross-browser": crossBrowser,
  ssr,
};

const server = await serve();
base = server.url;
try {
  const run =
    check === "all"
      ? Object.keys(CHECKS).filter((k) => k !== "cross-browser")
      : [check];
  for (const name of run) {
    if (!CHECKS[name])
      throw new Error(
        `unknown check "${name}"; one of ${Object.keys(CHECKS).join(", ")}`,
      );
    await CHECKS[name]();
  }
} finally {
  server.close();
  writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n${results.length} results written to ${outFile}`);
}
