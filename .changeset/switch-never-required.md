---
"@aleixvidal/ui": minor
---

`Switch` no longer accepts `required` or `aria-required`, and a `required` `Field` no longer sets `aria-required` on it: a switch acts as soon as it is toggled and `role="switch"` does not support `aria-required`. Use a `Checkbox` for a consent the user must give.
