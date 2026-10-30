// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type PackageJson = {
  exports?: Record<string, unknown>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const pkg: PackageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

describe("@aleixvidal/ui package manifest", () => {
  it("should not depend on Next.js or a router", () => {
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

  it("should ship OtpInput as its own entry point, not from the root entry", () => {
    const root = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

    // input-otp has no `sideEffects: false`, so exporting it from the root made every component
    // about 2.7 kB larger for anyone importing the package.
    expect(pkg.exports).toHaveProperty("./otp-input");
    expect(root).not.toMatch(/otp-input|input-otp/);
  });
});
