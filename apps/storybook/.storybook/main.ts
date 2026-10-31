import { themeValues } from "@aleixvidal/tokens";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";
import { toHex } from "../src/lib/css-values";
import { siteHeadTags } from "../src/site";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)",
    // The components' own stories live next to them in packages/ui.
    "../../../packages/ui/src/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "storybook-addon-pseudo-states",
  ],
  // IBM Plex Mono is self-hosted: scripts/copy-fonts.ts copies the woff2 files into public/fonts,
  // public/fonts/fonts.css declares them, and the *-head.html files load them. public/ also holds
  // the favicon (Storybook picks up public/favicon.svg), the Open Graph image and robots.txt.
  staticDirs: ["../public"],
  // The description, canonical address and social tags, after manager-head.html. The tab title is
  // set in manager.ts and, for the HTML as served, by scripts/brand-html.ts after the build.
  // The background is the manager's own (appBg), so its first paint, before Storybook injects its
  // theme from JavaScript, is dark instead of one white frame on every load. No `color-scheme`: a
  // preview iframe whose scheme differed from the manager's would get an opaque canvas until its
  // own CSS loads.
  managerHead: (head) => {
    const background = toHex(themeValues.dark["bg.base"]);
    return `${head}\n<style>html { background: ${background}; }</style>\n${siteHeadTags(background)}`;
  },
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  features: {
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  typescript: {
    // react-docgen-typescript needs the TypeScript compiler API, which TypeScript 7 does not ship.
    reactDocgen: "react-docgen",
    check: false,
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      // The pace of the demo `play` functions (packages/ui/src/test/demo.ts). CI sets it to 0;
      // unset, the demos keep their readable pace. The Vitest addon applies this config too.
      define: {
        __STORYBOOK_PLAY_DELAY__: JSON.stringify(
          process.env.STORYBOOK_PLAY_DELAY ?? "",
        ),
      },
    }),
};

// Storybook reads its configuration from the default export; this is the one allowed exception
// to "named exports only" (AGENTS.md section 5).
export default config;
