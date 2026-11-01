---
"@aleixvidal/ui": patch
---

`DatePicker` never reports a date the field does not show. While any part is empty, or the year has fewer than four digits, `onValueChange` is called with `null` and a form submits no date; for example "3/dd/2025" reports `null`, not `2025-03-01`, and a year being deleted never reports an intermediate value such as `0202-03-12`. The field keeps showing what was typed, in controlled and uncontrolled use.
