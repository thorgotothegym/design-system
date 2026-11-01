/**
 * Lighthouse summary: `pnpm lighthouse:summary`, after `lhci collect` and `lhci upload`.
 *
 * Reads the manifest that `lhci upload --target=filesystem` writes and prints, per URL, the
 * median and the range of the Performance and Accessibility scores over every run. The thresholds
 * in lighthouserc.json are asserted on the median, so this is the number to compare with them.
 * In GitHub Actions it also writes the table to the job summary.
 * Plain Node (type stripping), no dependencies.
 */
import { appendFileSync, readFileSync } from "node:fs";

type Entry = {
  url: string;
  summary: { performance: number; accessibility: number };
};

// The manifest is JSON written by lhci; its shape is documented in its configuration docs.
const manifest = JSON.parse(
  readFileSync(".lighthouseci/reports/manifest.json", "utf8"),
) as Entry[];

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const score = (value: number) => Math.round(value * 100);
const describe = (values: number[]) =>
  `${score(median(values))} (${score(Math.min(...values))}–${score(Math.max(...values))})`;

const byUrl = new Map<string, Entry[]>();
for (const entry of manifest) {
  byUrl.set(entry.url, [...(byUrl.get(entry.url) ?? []), entry]);
}

const rows = [...byUrl].map(([url, entries]) => {
  const path = new URL(url).pathname + new URL(url).search;
  return `| \`${path}\` | ${entries.length} | ${describe(entries.map((e) => e.summary.performance))} | ${describe(entries.map((e) => e.summary.accessibility))} |`;
});

const table = [
  "| URL | Runs | Performance, median (range) | Accessibility, median (range) |",
  "| --- | --- | --- | --- |",
  ...rows,
].join("\n");

console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Lighthouse\n\n${table}\n`,
  );
}
