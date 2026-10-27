import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scaleValues, themes, themeValues, tokens } from "./index";
import type { ColorToken } from "./index";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");
const css = read("../generated/tokens.css");
const tailwind = read("../generated/tailwind.css");

/** Copied by hand from DESIGN.md sections 2.1 and 2.2. Do not derive this from the token files. */
const expected = {
  dark: {
    "bg.base": "oklch(0.08 0 0)",
    "bg.surface": "oklch(0.10 0 0)",
    "bg.subtle": "oklch(0.12 0 0)",
    "bg.input": "oklch(0.15 0 0)",
    "text.default": "oklch(0.75 0.15 145)",
    "text.muted": "oklch(0.62 0.09 145)",
    "text.placeholder": "oklch(0.58 0.08 145)",
    "text.on-primary": "oklch(0.08 0 0)",
    "text.danger": "oklch(0.70 0.19 25)",
    "brand.primary": "oklch(0.70 0.18 145)",
    "border.decorative": "oklch(0.20 0.05 145)",
    "border.control": "oklch(0.50 0.10 145)",
    "focus.ring": "oklch(0.70 0.18 145)",
  },
  light: {
    "bg.base": "oklch(0.98 0.01 145)",
    "bg.surface": "oklch(1 0 0)",
    "bg.subtle": "oklch(0.95 0.015 145)",
    "bg.input": "oklch(1 0 0)",
    "text.default": "oklch(0.22 0.04 145)",
    "text.muted": "oklch(0.45 0.05 145)",
    "text.placeholder": "oklch(0.50 0.05 145)",
    "text.on-primary": "oklch(0.98 0.01 145)",
    "text.danger": "oklch(0.50 0.20 27)",
    "brand.primary": "oklch(0.45 0.14 145)",
    "border.decorative": "oklch(0.90 0.03 145)",
    "border.control": "oklch(0.60 0.07 145)",
    "focus.ring": "oklch(0.45 0.14 145)",
  },
} as const satisfies Record<
  (typeof themes)[number],
  Record<ColorToken, string>
>;

/** The CSS block of one theme, from its selector to the closing brace. */
const block = (selector: string): string => {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf("}", start));
};

describe("semantic colors", () => {
  it("should define exactly the 13 tokens of DESIGN.md in both themes", () => {
    expect(Object.keys(expected.dark)).toHaveLength(13);
    expect(Object.keys(themeValues.dark).sort()).toEqual(
      Object.keys(expected.dark).sort(),
    );
    expect(Object.keys(themeValues.light).sort()).toEqual(
      Object.keys(expected.light).sort(),
    );
  });

  it.each(themes)(
    "should have the exact DESIGN.md OKLCH value for every token (%s)",
    (theme) => {
      expect(themeValues[theme]).toEqual(expected[theme]);
    },
  );

  it.each([
    ["dark", '[data-theme="dark"]'],
    ["light", '[data-theme="light"]'],
  ] as const)(
    "should emit every %s value as a CSS custom property, unchanged",
    (theme, selector) => {
      const themeBlock = block(selector);
      expect(themeBlock).toContain(`color-scheme: ${theme};`);
      for (const [name, value] of Object.entries(expected[theme])) {
        expect(themeBlock).toContain(
          `--ds-color-${name.replace(".", "-")}: ${value};`,
        );
      }
    },
  );

  it("should make dark the default and switch with one attribute", () => {
    expect(css).toMatch(/:root,\n\[data-theme="dark"\] \{/);
    expect(css).not.toContain("prefers-color-scheme");
  });

  it("should expose every semantic color to Tailwind", () => {
    for (const name of Object.keys(expected.dark)) {
      const key = name.replace(".", "-");
      expect(tailwind).toContain(`--color-${key}: var(--ds-color-${key});`);
    }
    expect(tailwind).toContain("@theme inline {");
  });
});

describe("palette layer", () => {
  it("should not be exported: no output mentions it", () => {
    expect(css).not.toContain("palette");
    expect(tailwind).not.toContain("palette");
    expect(JSON.stringify(tokens)).not.toContain("palette");
    expect(Object.keys(tokens)).not.toContain("palette");
  });
});

describe("scales", () => {
  it("should derive the radius scale from the 0.25rem base", () => {
    expect(css).toContain("--ds-radius-base: 0.25rem;");
    expect(css).toContain("--ds-radius-sm: 0;");
    expect(css).toContain("--ds-radius-md: 2px;");
    expect(css).toContain("--ds-radius-lg: 0.25rem;");
    expect(css).toContain("--ds-radius-xl: 8px;");
  });

  it("should keep spacing on the 4px grid", () => {
    const steps = [...css.matchAll(/--ds-space-(\d+): ([\d.]+)rem;/g)];
    expect(steps.length).toBeGreaterThan(0);
    for (const [, step, rem] of steps) {
      expect(Number(rem) * 16).toBe(Number(step) * 4);
    }
  });

  it("should resolve font.sans to the same stack as font.mono for now", () => {
    const stack = '"IBM Plex Mono", "Geist Mono", monospace';
    expect(css).toContain(`--ds-font-mono: ${stack};`);
    expect(css).toContain(`--ds-font-sans: ${stack};`);
  });

  it("should have four shadow levels and no glow", () => {
    expect(Object.keys(tokens.shadow)).toEqual(["none", "sm", "md", "lg"]);
  });
});

describe("scaleValues", () => {
  it("should expose the same resolved values as the CSS custom properties", () => {
    expect(scaleValues.space["4"]).toBe("1rem");
    expect(css).toContain(`--ds-space-4: ${scaleValues.space["4"]};`);
    expect(scaleValues.radius.lg).toBe("0.25rem");
    expect(css).toContain(`--ds-radius-lg: ${scaleValues.radius.lg};`);
    expect(css).toContain(`--ds-shadow-md: ${scaleValues.shadow.md};`);
  });

  it("should not expose the palette", () => {
    expect(JSON.stringify(scaleValues)).not.toContain("palette");
  });
});

describe("typed token names", () => {
  it("should return CSS variable references", () => {
    expect(tokens.color.bg.base).toBe("var(--ds-color-bg-base)");
    expect(tokens.space[4]).toBe("var(--ds-space-4)");
  });

  it("should reject a misspelled token at compile time", () => {
    // @ts-expect-error -- "baze" is not a token; if this line compiles the types are too loose
    expect(tokens.color.bg.baze).toBeUndefined();
    // @ts-expect-error -- "bg.baze" is not a ColorToken
    const typo: ColorToken = "bg.baze";
    expect(typo).toBe("bg.baze");
  });
});
