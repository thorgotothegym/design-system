// A separate entry point, `@aleixvidal/ui/otp-input`, on purpose: input-otp does not declare
// `"sideEffects": false`, so a bundler keeps it for anything that imports the root entry, which
// made every component about 2.7 kB larger. Anything with a dependency like that goes here, not
// in `index.ts` (see AGENTS.md section 5).
export { OtpInput } from "./components/otp-input";
export type { OtpInputProps } from "./components/otp-input";
