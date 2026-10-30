---
"@aleixvidal/ui": patch
---

Focus rings state `outline-solid` explicitly, and the elements that must not draw their own ring (the text field inside `Input` and `TagInput`, and `Select` options before they are highlighted) use a transparent outline instead of removing it. Nothing changes in the light or dark theme. In forced-colors mode the inner text field still gets a system-color ring, now the browser's own 1px ring instead of Tailwind's 2px fallback.
