---
"@aleixvidal/ui": minor
---

Add the `DatePicker` component, at its own entry point `@aleixvidal/ui/date-picker`, built on React Aria: one date typed part by part (in the order of the locale) or chosen in a calendar popover, fully keyboard operable. The value is an ISO 8601 date string with no time zone. It supports `min`, `max`, `isDateDisabled`, `locale`, `firstDayOfWeek`, controlled and uncontrolled use, `name` for native forms, and works inside a `Field` and with react-hook-form; a typed date outside the allowed range is marked invalid. Adds `react-aria-components` and `@internationalized/date` as dependencies.
