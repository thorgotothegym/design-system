import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

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
  // public/fonts/fonts.css declares them, and the *-head.html files load them.
  staticDirs: ["../public"],
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
    mergeConfig(viteConfig, { plugins: [tailwindcss()] }),
};

// Storybook reads its configuration from the default export; this is the one allowed exception
// to "named exports only" (AGENTS.md section 5).
export default config;
