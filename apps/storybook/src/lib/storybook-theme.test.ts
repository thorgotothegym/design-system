import { themeValues } from "@aleixvidal/tokens";
import { describe, expect, it } from "vitest";
import { toHex } from "./css-values";
import { createStorybookTheme } from "./storybook-theme";

describe("createStorybookTheme", () => {
  it("should build the dark theme from the dark tokens", () => {
    const theme = createStorybookTheme("dark");

    expect(theme.base).toBe("dark");
    expect(theme.appBg).toBe(toHex(themeValues.dark["bg.base"]));
    expect(theme.appContentBg).toBe(toHex(themeValues.dark["bg.surface"]));
    expect(theme.colorPrimary).toBe(toHex(themeValues.dark["brand.primary"]));
    expect(theme.textColor).toBe(toHex(themeValues.dark["text.default"]));
    expect(theme.inputBorder).toBe(toHex(themeValues.dark["border.control"]));
  });

  it("should build the light theme from the light tokens", () => {
    const theme = createStorybookTheme("light");

    expect(theme.base).toBe("light");
    expect(theme.appBg).toBe(toHex(themeValues.light["bg.base"]));
    expect(theme.textColor).toBe(toHex(themeValues.light["text.default"]));
  });

  it("should use the monospace stack and the base radius", () => {
    const theme = createStorybookTheme("dark");

    expect(theme.fontBase).toBe('"IBM Plex Mono", "Geist Mono", monospace');
    expect(theme.fontCode).toBe(theme.fontBase);
    expect(theme.appBorderRadius).toBe(4);
  });

  it("should carry the brand title when one is given", () => {
    expect(createStorybookTheme("dark", "design-system_").brandTitle).toBe(
      "design-system_",
    );
  });
});
