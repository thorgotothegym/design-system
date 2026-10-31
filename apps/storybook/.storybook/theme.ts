import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";

type ThemeName = "dark" | "light";

/** Turns transitions off while the page repaints in the new theme (preview.css). */
const SWITCHING_CLASS = "ds-theme-switching";

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
 * Switches the page to `theme` in one style recalculation: `data-theme` selects the tokens and
 * `color-scheme` (both in tokens.css), and no transition runs, so no frame mixes the two themes.
 * The class stays for two frames: the first one paints the new theme, then transitions are back
 * for hover and focus.
 */
const applyTheme = (theme: ThemeName) => {
  const root = document.documentElement;
  if (root.getAttribute("data-theme") === theme) return;
  root.classList.add(SWITCHING_CLASS);
  root.setAttribute("data-theme", theme);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.remove(SWITCHING_CLASS)),
  );
};

/**
 * The toolbar theme, kept outside React. It applies the theme as soon as the preview receives the
 * global, before anything re-renders: the addon-themes decorator only sets the attribute in an
 * effect once the story has rendered again (about 170 ms later), and decorators do not run on
 * MDX pages without stories. The docs container subscribes to it for the docs page theme.
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
    if (next === undefined) return;
    applyTheme(next);
    if (next === current) return;
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

export const themeStore = createThemeStore();
