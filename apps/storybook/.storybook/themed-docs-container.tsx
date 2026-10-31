import { DocsContainer } from "@storybook/addon-docs/blocks";
import type { ComponentProps } from "react";
import { useSyncExternalStore } from "react";
import { createStorybookTheme } from "../src/lib/storybook-theme";
import { themeStore } from "./theme";

type DocsContainerProps = ComponentProps<typeof DocsContainer>;

const docsThemes = {
  dark: createStorybookTheme("dark"),
  light: createStorybookTheme("light"),
};

/** Docs pages in the toolbar theme. The store has already set `data-theme` when this renders. */
export const ThemedDocsContainer = ({
  children,
  context,
}: DocsContainerProps) => {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get);

  return (
    <DocsContainer context={context} theme={docsThemes[theme]}>
      {children}
    </DocsContainer>
  );
};
