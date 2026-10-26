import { themeValues } from "../src/generated/tokens.ts";
import { checkContrast, formatReport } from "./contrast/check.ts";
import { pairs } from "./contrast/pairs.ts";

const report = checkContrast(themeValues, pairs);
console.log(formatReport(report));
process.exitCode = report.ok ? 0 : 1;
