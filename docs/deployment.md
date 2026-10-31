# Deployment

The Storybook is a static site deployed on Vercel from this repository:

- Production: **https://design.aleixvidal.dev**, the canonical address. The Vercel address, https://design-system-seven-lake.vercel.app, serves the same build but is not indexed.
- Previews: every pull request gets a preview deployment, linked from the PR checks.

Everything that can live in the repository does: [`apps/storybook/vercel.json`](../apps/storybook/vercel.json) overrides the build settings of the Vercel project, so a deployment does not depend on what the dashboard says.

## What vercel.json does

| Setting           | Value                                                                                                     | Why                                                                                                                                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `framework`       | `storybook`                                                                                               | The Vercel preset for a static Storybook.                                                                                                                                                                                                                                      |
| `installCommand`  | `cd ../.. && npx --yes "$(node -p "require('./package.json').packageManager")" install --frozen-lockfile` | Installs from the repository root with the exact pnpm in the root `packageManager` field (`pnpm@11.x`). Vercel picks the oldest pnpm in its image for a custom `pnpm install`, and Corepack would need a dashboard variable. Reading the field keeps the version in one place. |
| `buildCommand`    | `cd ../.. && npx --yes "<same pnpm>" turbo run build --filter=@aleixvidal/storybook`                      | The same Turborepo task as `pnpm build`, filtered to this app. `dependsOn: ["^build"]` builds `@aleixvidal/tokens` and `@aleixvidal/ui` first. Running pnpm through `npx` puts that pnpm on the `PATH`, so the `pnpm run build` calls Turborepo makes use it too.              |
| `outputDirectory` | `storybook-static`                                                                                        | What `storybook build -o storybook-static` writes. The app's `build` script then runs `scripts/brand-html.ts`, which sets the page titles (see below).                                                                                                                         |
| `ignoreCommand`   | `sh scripts/vercel-ignore.sh`                                                                             | Skips the deployment only when Turborepo says nothing the site is built from changed; anything else builds. See [Skipped builds](#skipped-builds).                                                                                                                             |
| `headers`         | see below                                                                                                 | Caching, security and indexing.                                                                                                                                                                                                                                                |

### Headers

| Path                                                   | Header                                       | Value                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| everything                                             | `X-Content-Type-Options`                     | `nosniff`                                                                                                                                                                                                                                                                                                  |
| everything                                             | `Referrer-Policy`                            | `strict-origin-when-cross-origin`                                                                                                                                                                                                                                                                          |
| everything                                             | `Permissions-Policy`                         | every powerful feature the site does not use is disabled (camera, microphone, geolocation, payment, USB, sensors, ...)                                                                                                                                                                                     |
| everything                                             | `X-Frame-Options`, `Content-Security-Policy` | `SAMEORIGIN` and `frame-ancestors 'self'`: other sites cannot frame it, while Storybook's own preview iframe (same origin) still loads. The CSP has only this directive (see below).                                                                                                                       |
| everything                                             | `Cache-Control`                              | `public, max-age=0, must-revalidate`: the HTML, `index.json`, `project.json` and Storybook's unhashed `sb-manager/` and `sb-addons/` files are revalidated on every visit, so a deployment is seen at once.                                                                                                |
| `/assets/*`                                            | `Cache-Control`                              | `public, max-age=31536000, immutable`: Vite puts a content hash in every file name there.                                                                                                                                                                                                                  |
| `/fonts/files/*`                                       | `Cache-Control`                              | `public, max-age=31536000, immutable`: the preloaded IBM Plex Mono files. Their names are not hashed, so if `@fontsource/ibm-plex-mono` ever changed a file under the same name, returning visitors would keep the old one for up to a year. That is acceptable for a font; rename the file if it matters. |
| everything, unless the host is `design.aleixvidal.dev` | `X-Robots-Tag`                               | `noindex`: the vercel.app address and any preview stay out of search results. Vercel already adds this to preview deployments; this also covers the production vercel.app address.                                                                                                                         |

**No full Content-Security-Policy.** Storybook's own HTML runs inline scripts (it writes its configuration into `window` from `<script>` tags in `index.html` and `iframe.html`), and React Aria and `input-otp` add `<style>` elements at runtime. A useful policy would need a nonce per response, which a static host cannot generate. A policy that allows `'unsafe-inline'` would add little protection. Only `frame-ancestors` is set. The components themselves support a nonce for apps that have a CSP (see `packages/ui/README.md`).

## Presentation

The public name, byline and tagline are constants in [`apps/storybook/src/site.ts`](../apps/storybook/src/site.ts). Everything visible derives from them:

- the welcome heading (`src/introduction.mdx`) and the sidebar brand (`.storybook/manager.ts`);
- the tab title:
  - Storybook writes "<page> ⋅ Storybook" and has no option for it, so `manager.ts` replaces the suffix;
  - `scripts/brand-html.ts` sets the `<title>` of the built HTML, which link previews read;
- the description, canonical link (`https://design.aleixvidal.dev/`), Open Graph and Twitter card tags (`managerHead` in `.storybook/main.ts`);
- the favicon (`public/favicon.svg`) and the Open Graph image (`public/og-image.png`, 1200 × 630). Both are generated from the constants and the dark theme tokens by [`scripts/brand-assets.ts`](../apps/storybook/scripts/brand-assets.ts): an HTML page in the terminal style, rendered with Playwright's Chromium. They are committed, so a deployment needs no browser. After renaming, run:

  ```sh
  pnpm --filter @aleixvidal/storybook brand-assets
  ```

`public/robots.txt` allows everything. There is no sitemap: Storybook is a single page whose stories are query parameters (`?path=...`), all with the same canonical address, so a sitemap would list nothing a crawler cannot already reach.

## Skipped builds

Vercel already skips the project when no workspace it depends on changed, but it treats files outside the workspaces (`docs/`, `.github/`, `BACKLOG.md`, `AGENTS.md`, root scripts) as global changes and builds anyway. The `ignoreCommand` closes that gap.

**Vercel accepts only two exit codes** from the Ignored Build Step: 0 skips the deployment and 1 builds it. **Any other code fails the deployment.** `turbo query affected --exit-code` returns 2 on an error, for example with an empty `--base` on a branch's first deployment, so it cannot be the command on its own. [`scripts/vercel-ignore.sh`](../apps/storybook/scripts/vercel-ignore.sh) wraps it so that **the only way to skip is the query succeeding with exit 0**. Every other outcome exits 1 and builds:

| Situation                                                                                                | Exit | Result |
| -------------------------------------------------------------------------------------------------------- | ---- | ------ |
| The query runs and nothing `@aleixvidal/storybook` is built from changed since `VERCEL_GIT_PREVIOUS_SHA` | 0    | skip   |
| The query runs and something changed                                                                     | 1    | build  |
| No previous deployment: `VERCEL_GIT_PREVIOUS_SHA` empty or unset (a branch's first deployment)           | 1    | build  |
| The previous commit is not in the clone (unknown, or older than Vercel's `--depth=10` shallow clone)     | 1    | build  |
| `npx` or `turbo` missing, no network to download turbo, or any other code from the query                 | 1    | build  |

`apps/storybook/scripts/vercel-ignore.test.ts` (in `pnpm test`) checks the empty, unset and unknown previous commit, and the mapping of every query result (with an `npx` stub, so it runs offline).

A change to `turbo.json` or a root file Turborepo hashes for every task (`.nvmrc`, `pnpm-workspace.yaml`) affects every package, so it builds. Checked on real commits from a clean clone:

| Change                                                               | Result |
| -------------------------------------------------------------------- | ------ |
| `docs/screenshots/*` only                                            | skip   |
| `BACKLOG.md` only                                                    | skip   |
| `.github/prompts/*` only                                             | skip   |
| `.github/workflows/*`, `.github/actions/*`, `.changeset/config.json` | skip   |
| `AGENTS.md` only                                                     | skip   |
| `scripts/test-scaffold.mts` (root) only                              | skip   |
| `packages/ui/src/...`                                                | build  |
| `packages/tokens/src/...`                                            | build  |
| `apps/storybook/...`                                                 | build  |
| `turbo.json` only, `.nvmrc` only                                     | build  |

To force a deployment of a skipped commit, use **Redeploy** in the Vercel dashboard and untick "Use project's Ignore Build Step".

## Configured in the Vercel dashboard (by a person)

These cannot live in the repository:

- **Root Directory:** `apps/storybook`, with "Include files outside the root directory" on (the default for monorepos), because the commands `cd ../..` to the repository root.
- **Domains:** `design.aleixvidal.dev` assigned to production. The DNS record at the domain's provider points to Vercel.
- **Node.js version:** 24.x, matching `.nvmrc` and `engines`.
- **Deployment Protection** for previews, if the previews should not be public.

Everything else (framework, install, build and output, ignored build step, headers) comes from `vercel.json` and overrides the dashboard.

## Reproducing the build locally

From a clean clone, run the same commands Vercel runs, from `apps/storybook`:

```sh
cd apps/storybook
sh -c "$(node -p "require('./vercel.json').installCommand")"
sh -c "$(node -p "require('./vercel.json').buildCommand")"
ls storybook-static   # index.html, iframe.html, assets/, fonts/, favicon.svg, og-image.png, robots.txt
```

To check whether a commit would be deployed, run the same script Vercel runs, from `apps/storybook`, on a clean tree (uncommitted changes count as changes):

```sh
VERCEL_GIT_PREVIOUS_SHA=<previous deployed sha> sh scripts/vercel-ignore.sh; echo $?   # 0 skip, 1 build
```
