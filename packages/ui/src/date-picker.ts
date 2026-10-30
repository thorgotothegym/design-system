// A separate entry point, `@aleixvidal/ui/date-picker`, because of its size: React Aria's date
// and calendar code with the strings of every locale is about 60 kB brotli, twice the heaviest
// component in the root entry (see AGENTS.md section 5).
export { DatePicker } from "./components/date-picker";
export type { DatePickerProps } from "./components/date-picker";
