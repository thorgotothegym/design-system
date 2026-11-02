---
"@aleixvidal/ui": patch
---

`Field` wires its description and label during render, so server-rendered HTML is complete before the page is interactive: the control's `aria-describedby` already references the `Field.Description`, and group controls (`RadioGroup`, `Slider`, `DatePicker`) already have `aria-labelledby` pointing at the `Field.Label`. Before, both were added only after hydration. A description or label wrapped in another component is still found once it mounts, as before. Nothing changes after hydration, and no API changes.
