import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type PackageJson = {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const pkg: PackageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

describe("@aleixvidal/ui package manifest", () => {
  it("does not depend on Next.js or a router", () => {
    const names = Object.keys({
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.devDependencies,
    });
    const forbidden = names.filter((name) =>
      /^(next($|-|\/)|@next\/|react-router|@tanstack\/(react-)?router)/.test(
        name,
      ),
    );
    expect(forbidden).toEqual([]);
  });
});
