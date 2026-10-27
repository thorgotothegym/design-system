import vitest from "@vitest/eslint-plugin";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import testingLibrary from "eslint-plugin-testing-library";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * Shared ESLint configuration. The TypeScript rules are errors on purpose:
 * `--max-warnings 0` is not a substitute for rules that actually fail.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  { ignores: ["dist/**", "coverage/**", "storybook-static/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: { turbo: turboPlugin },
    rules: {
      "turbo/no-undeclared-env-vars": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      // Functions are `const` arrow functions, never the `function` keyword (AGENTS.md section 5).
      "func-style": ["error", "expression"],
      "prefer-arrow-callback": "error",
      // Closes the gap in func-style: `const f = function () {}` is also rejected.
      // Methods and accessors are exempt, they cannot be arrow functions.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            ":not(MethodDefinition, Property[method=true], Property[kind='get'], Property[kind='set']) > FunctionExpression",
          message:
            "Use a const arrow function instead of the function keyword (AGENTS.md section 5).",
        },
      ],
    },
  },
  {
    // Testing conventions (AGENTS.md section 9).
    files: ["**/*.test.{ts,tsx}"],
    plugins: { vitest, "testing-library": testingLibrary },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/no-identical-title": "error",
      "vitest/valid-title": [
        "error",
        { mustMatch: { it: ["^should "], test: ["^should "] } },
      ],
      "vitest/no-restricted-matchers": [
        "error",
        {
          toMatchSnapshot: "No snapshot tests of markup.",
          toMatchInlineSnapshot: "No snapshot tests of markup.",
        },
      ],
      "testing-library/prefer-user-event": "error",
      "testing-library/prefer-screen-queries": "error",
      "testing-library/no-node-access": "error",
      "testing-library/no-container": "error",
    },
  },
];
