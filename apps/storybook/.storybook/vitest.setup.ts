import { afterEach, beforeEach, vi } from "vitest";

/**
 * Fails a story test when the story logs a `console.error` or `console.warn`, such as React's
 * warnings (duplicate keys, invalid props) that only exist in development builds and would
 * otherwise pass CI silently. Runs for every story in both themes (`pnpm test:storybook`).
 *
 * A message that is expected and not ours goes in ALLOWED, with the reason. It is empty: the two
 * warnings Storybook logs on every page (`PopoverProvider` and `ariaLabel`, a Storybook 11
 * deprecation) come from the manager UI, which these tests do not run.
 */
const ALLOWED: readonly { pattern: RegExp; reason: string }[] = [];

const logged: string[] = [];

const describeArgument = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

beforeEach(() => {
  logged.length = 0;
  for (const level of ["error", "warn"] as const) {
    const original = console[level].bind(console);
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logged.push(`console.${level}: ${args.map(describeArgument).join(" ")}`);
      original(...args);
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  const unexpected = logged.filter(
    (message) => !ALLOWED.some(({ pattern }) => pattern.test(message)),
  );
  if (unexpected.length > 0) {
    throw new Error(
      `The story logged ${unexpected.length} unexpected console message(s). Fix them, or add them to ALLOWED in .storybook/vitest.setup.ts with the reason:\n${unexpected.join("\n")}`,
    );
  }
});
