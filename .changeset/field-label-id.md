---
"@aleixvidal/ui": minor
---

`Field.Label` now has a generated id (`<id>-label`) that group controls such as `RadioGroup` reference with `aria-labelledby`, because `htmlFor` cannot label a group. It no longer accepts an `id` prop. It is also dimmed inside any disabled ancestor (a disabled `Field` as before, or a disabled group).
