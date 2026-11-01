---
"@aleixvidal/ui": minor
---

`Switch` does not accept `required` or `aria-required`, and a `required` `Field` does not set `aria-required` on it: a switch acts as soon as it is toggled and `role="switch"` does not support `aria-required`. Use a `Checkbox` for a consent the user must give.
