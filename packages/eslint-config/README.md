# @aleixvidal/eslint-config

Shared ESLint flat configs: `./base` for any TypeScript package, `./react` for packages that render React.

The rules that matter for this repository (`type` over `interface`, no `any`, no non-null assertions) are errors, and `src/rules.test.ts` proves it by linting offending snippets.
