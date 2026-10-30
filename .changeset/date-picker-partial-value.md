---
"@aleixvidal/ui": patch
---

`DatePicker` no longer reports a date the field does not show. While any part is empty, or the year has fewer than four digits, `onValueChange` is called with `null` and a form submits no date; before, it kept the last complete value (`2025-03-01` for "3/dd/2025") or an intermediate year (`0202-03-12` while the year was being deleted). The field keeps showing what was typed, in controlled and uncontrolled use.
