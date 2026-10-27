import { DocsContainer } from "@storybook/addon-docs/blocks";
import type { ComponentProps } from "react";
import { useEffect, useSyncExternalStore } from "react";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import { createStorybookTheme } from "../src/lib/storybook-theme";

type DocsContainerProps = ComponentProps<typeof DocsContainer>;
type ThemeName = "dark" | "light";

const docsThemes = {
  dark: createStorybookTheme("dark"),
  light: createStorybookTheme("light"),
};

const toThemeName = (value: unknown): ThemeName =>
  value === "light" ? "light" : "dark";

/** `globals.theme` out of the payload of SET_GLOBALS / GLOBALS_UPDATED. */
const themeFromPayload = (payload: unknown): ThemeName | undefined => {
  if (typeof payload !== "object" || payload === null) return undefined;
  const globals =
    "userGlobals" in payload
      ? payload.userGlobals
      : "globals" in payload
        ? payload.globals
        : undefined;
  if (typeof globals !== "object" || globals === null || !("theme" in globals))
    return undefined;
  return toThemeName(globals.theme);
};

/**
 * The toolbar theme, kept outside React so a docs page that mounts later (navigation between
 * pages) still knows it. Decorators do not run on MDX pages without stories, so the docs
 * container follows the global itself.
 */
const createThemeStore = () => {
  let current: ThemeName = toThemeName(
    new URLSearchParams(window.location.search)
      .get("globals")
      ?.match(/theme:(\w+)/)?.[1],
  );
  const listeners = new Set<() => void>();

  const update = (payload: unknown) => {
    const next = themeFromPayload(payload);
    if (next === undefined || next === current) return;
    current = next;
    listeners.forEach((listener) => listener());
  };

  const channel = addons.getChannel();
  channel.on(SET_GLOBALS, update);
  channel.on(GLOBALS_UPDATED, update);

  return {
    get: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const themeStore = createThemeStore();

export const ThemedDocsContainer = ({
  children,
  context,
}: DocsContainerProps) => {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <DocsContainer context={context} theme={docsThemes[theme]}>
      {children}
    </DocsContainer>
  );
};
