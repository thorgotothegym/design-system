import { defineConfig } from "tsup";

// Declarations are emitted by `tsc` (see tsconfig.build.json): tsup's `dts` option needs
// the TypeScript JS API, which TypeScript 7 does not ship.
export default defineConfig({
  entry: ["src/index.ts", "src/contrast/index.ts"],
  format: ["esm"],
  clean: true,
  sourcemap: true,
});
