import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
import { config } from "../base.js";

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });

const ruleIds = async (
  code: string,
  filePath = "sample.ts",
): Promise<string[]> => {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map(
    (message) => message.ruleId ?? "parse-error",
  );
};

describe("shared ESLint config", () => {
  it("should reject interface declarations", async () => {
    const ids = await ruleIds("export interface Props { a: string }\n");
    expect(ids).toContain("@typescript-eslint/consistent-type-definitions");
  });

  it("should accept type aliases", async () => {
    expect(await ruleIds("export type Props = { a: string };\n")).toEqual([]);
  });

  it("should reject any", async () => {
    const ids = await ruleIds("export const value: any = 1;\n");
    expect(ids).toContain("@typescript-eslint/no-explicit-any");
  });

  it("should reject non-null assertions", async () => {
    const ids = await ruleIds(
      "declare const a: string | null;\nexport const b = a!;\n",
    );
    expect(ids).toContain("@typescript-eslint/no-non-null-assertion");
  });

  it("should require import type for type-only imports", async () => {
    const ids = await ruleIds(
      'import { ESLint } from "eslint";\nexport type X = ESLint;\n',
    );
    expect(ids).toContain("@typescript-eslint/consistent-type-imports");
  });
});

describe("function style", () => {
  it("should reject function declarations", async () => {
    const ids = await ruleIds("export function getLabel() { return 'a'; }\n");

    expect(ids).toContain("func-style");
  });

  it("should reject function expressions used as callbacks", async () => {
    const ids = await ruleIds(
      "export const doubled = [1].map(function (n) { return n * 2; });\n",
    );

    expect(ids).toContain("prefer-arrow-callback");
  });

  it("should reject function expressions assigned to a const", async () => {
    const ids = await ruleIds(
      "export const getLabel = function () { return 'a'; };\n",
    );

    expect(ids).toContain("no-restricted-syntax");
  });

  it("should accept methods and accessors, which cannot be arrow functions", async () => {
    const ids = await ruleIds(
      "export const label = { get text() { return 'a'; }, format() { return 'b'; } };\nexport class Label { format() { return 'c'; } }\n",
    );

    expect(ids).toEqual([]);
  });

  it("should accept const arrow functions", async () => {
    const ids = await ruleIds(
      "export const getLabel = (id: string) => id;\nexport const doubled = [1].map((n) => n * 2);\n",
    );

    expect(ids).toEqual([]);
  });
});

describe("test files", () => {
  const testFile = "sample.test.ts";

  it("should reject focused tests", async () => {
    const ids = await ruleIds(
      "import { it } from 'vitest';\nit.only('should run', () => {});\n",
      testFile,
    );

    expect(ids).toContain("vitest/no-focused-tests");
  });

  it("should reject disabled tests", async () => {
    const ids = await ruleIds(
      "import { it } from 'vitest';\nit.skip('should run', () => {});\n",
      testFile,
    );

    expect(ids).toContain("vitest/no-disabled-tests");
  });

  it("should reject test titles that do not start with should", async () => {
    const ids = await ruleIds(
      "import { it } from 'vitest';\nit('renders', () => {});\n",
      testFile,
    );

    expect(ids).toContain("vitest/valid-title");
  });

  it("should accept test titles that start with should", async () => {
    const ids = await ruleIds(
      "import { it } from 'vitest';\nit('should render', () => {});\n",
      testFile,
    );

    expect(ids).toEqual([]);
  });

  it("should reject snapshot assertions", async () => {
    const ids = await ruleIds(
      "import { expect, it } from 'vitest';\nit('should render', () => { expect(1).toMatchSnapshot(); });\n",
      testFile,
    );

    expect(ids).toContain("vitest/no-restricted-matchers");
  });

  it("should reject fireEvent", async () => {
    const ids = await ruleIds(
      "import { fireEvent, screen } from '@testing-library/react';\nexport const click = () => fireEvent.click(screen.getByRole('button'));\n",
      testFile,
    );

    expect(ids).toContain("testing-library/prefer-user-event");
  });

  it("should reject queries that do not come from screen", async () => {
    const ids = await ruleIds(
      "import { render } from '@testing-library/react';\ndeclare const element: never;\nexport const find = () => render(element).getByRole('button');\n",
      testFile,
    );

    expect(ids).toContain("testing-library/prefer-screen-queries");
  });

  it("should reject direct DOM node access", async () => {
    const ids = await ruleIds(
      "import { screen } from '@testing-library/react';\nexport const parent = () => screen.getByRole('button').parentElement;\n",
      testFile,
    );

    expect(ids).toContain("testing-library/no-node-access");
  });

  it("should reject the container escape hatch", async () => {
    const ids = await ruleIds(
      "import { render } from '@testing-library/react';\ndeclare const element: never;\nconst { container } = render(element);\nexport const first = container.querySelector('p');\n",
      testFile,
    );

    expect(ids).toContain("testing-library/no-container");
  });

  it("should not apply test rules to other files", async () => {
    const ids = await ruleIds(
      "export const parent = (node: HTMLElement) => node.parentElement;\n",
    );

    expect(ids).toEqual([]);
  });
});
