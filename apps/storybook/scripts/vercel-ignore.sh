#!/bin/sh
# Vercel's Ignored Build Step for the Storybook (vercel.json `ignoreCommand`).
#
# Vercel accepts two exit codes: 0 skips the deployment and 1 builds it. Any other code fails
# the deployment. So the only way to skip is the Turborepo query succeeding with exit 0
# (nothing the site is built from changed); every other outcome exits 1 and builds: no previous
# deployment (empty VERCEL_GIT_PREVIOUS_SHA, as on a branch's first deployment), a previous
# commit outside Vercel's shallow clone, npx or turbo missing or failing, no network, or any
# unexpected code from the query.

build() {
  echo "vercel-ignore: $1: building."
  exit 1
}

base="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -n "$base" ] || build "no previous deployment (VERCEL_GIT_PREVIOUS_SHA is empty)"

root=$(git rev-parse --show-toplevel 2>/dev/null) || build "not inside a git checkout"
cd "$root" || build "cannot enter $root"

git cat-file -e "$base^{commit}" 2>/dev/null ||
  build "the previous commit $base is not in this clone"

turbo_version=$(node -p "require('./package.json').devDependencies.turbo" 2>/dev/null) ||
  build "cannot read the Turborepo version from package.json"

npx --yes "turbo@$turbo_version" query affected \
  --packages @aleixvidal/storybook --base="$base" --exit-code >/dev/null 2>&1
code=$?

if [ "$code" -eq 0 ]; then
  echo "vercel-ignore: nothing @aleixvidal/storybook is built from changed since $base: skipping."
  exit 0
fi
build "turbo query affected exited with $code"
