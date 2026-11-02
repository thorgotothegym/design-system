---
"@aleixvidal/ui": patch
---

Document which structures give `Field` a complete server-rendered HTML. A `Field.Label` or `Field.Description` written as a child of the Field, also inside fragments, arrays, conditions and ternaries, is referenced in the server HTML. One inside another component (a wrapper, `memo`, `forwardRef`, a render prop or `lazy`) is referenced after hydration. In both cases the control never references a part that is not rendered.
