import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
import { config } from "../base.js";

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });

async function ruleIds(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: "sample.ts" });
  return (result?.messages ?? []).map(
    (message) => message.ruleId ?? "parse-error",
  );
}

describe("shared ESLint config", () => {
  it("rejects interface declarations", async () => {
    const ids = await ruleIds("export interface Props { a: string }\n");
    expect(ids).toContain("@typescript-eslint/consistent-type-definitions");
  });

  it("accepts type aliases", async () => {
    expect(await ruleIds("export type Props = { a: string };\n")).toEqual([]);
  });

  it("rejects any", async () => {
    const ids = await ruleIds("export const value: any = 1;\n");
    expect(ids).toContain("@typescript-eslint/no-explicit-any");
  });

  it("rejects non-null assertions", async () => {
    const ids = await ruleIds(
      "declare const a: string | null;\nexport const b = a!;\n",
    );
    expect(ids).toContain("@typescript-eslint/no-non-null-assertion");
  });

  it("requires import type for type-only imports", async () => {
    const ids = await ruleIds(
      'import { ESLint } from "eslint";\nexport type X = ESLint;\n',
    );
    expect(ids).toContain("@typescript-eslint/consistent-type-imports");
  });
});
