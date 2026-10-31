import { themeValues, themes } from "@aleixvidal/tokens";
import type { PairResult } from "@aleixvidal/tokens/contrast";
import type { ColorToken, Theme } from "@aleixvidal/tokens";
import { pairKey, report, roleOf } from "./contrast-report";
import { DataCell, DataRow, DataTable } from "./data-table";

type SampleProps = { result: PairResult };

// PairResult names tokens as plain strings; they came from `pairs`, which is typed with ColorToken.
const colorOf = (theme: string, token: string): string =>
  themeValues[theme as Theme][token as ColorToken];

/** Text pairs are shown as text, everything else (borders, ring, surfaces) as a bordered swatch. */
const Sample = ({ result }: SampleProps) => {
  const fg = colorOf(result.theme, result.fg);
  const bg = colorOf(result.theme, result.bg);

  return result.min === 4.5 ? (
    <span
      aria-hidden="true"
      className="inline-block rounded-md px-3 py-1 font-bold"
      style={{ color: fg, background: bg }}
    >
      Aa
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="inline-block size-8 rounded-md"
      style={{ background: bg, border: `2px solid ${fg}` }}
    />
  );
};

const verdict = (result: PairResult): string => {
  if (result.min === null) return "info";
  return result.passed ? "PASS" : "FAIL";
};

/** The ratio of every declared pair, per theme, computed by the same code as the contrast gate. */
export const ContrastPairs = () => (
  <div className="flex flex-col gap-8">
    {themes.map((theme) => (
      <DataTable
        key={theme}
        caption={`Contrast ratios, ${theme} theme`}
        columns={["Pair", "Sample", "Ratio", "Minimum", "Result", "Source"]}
      >
        {report.results
          .filter((result) => result.theme === theme)
          .map((result) => (
            <DataRow key={pairKey(result)}>
              <DataCell>
                <code>{result.fg}</code> on <code>{result.bg}</code>
              </DataCell>
              <DataCell>
                <Sample result={result} />
              </DataCell>
              <DataCell>{result.ratio.toFixed(2)}:1</DataCell>
              <DataCell>
                {result.min === null
                  ? "none (decorative)"
                  : `${result.min}:1 (${roleOf(result.min)})`}
              </DataCell>
              <DataCell>
                <strong
                  className={
                    result.passed ? "text-text-default" : "text-text-danger"
                  }
                >
                  {verdict(result)}
                </strong>
              </DataCell>
              <DataCell>{result.source}</DataCell>
            </DataRow>
          ))}
      </DataTable>
    ))}
  </div>
);
