---
"@aleixvidal/ui": minor
---

`Field.Label` has a generated id (`<id>-label`) that group controls such as `RadioGroup` reference with `aria-labelledby`, because `htmlFor` cannot label a group. It does not accept an `id` prop. It is dimmed inside any disabled ancestor: a disabled `Field` or a disabled group.
