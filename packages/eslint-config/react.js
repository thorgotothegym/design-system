import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * Shared ESLint configuration for packages that use React.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  { languageOptions: { globals: { ...globals.browser } } },
  pluginReactHooks.configs.flat.recommended,
];
