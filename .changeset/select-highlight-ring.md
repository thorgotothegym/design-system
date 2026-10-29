---
"@aleixvidal/ui": patch
"@aleixvidal/tokens": patch
---

The highlighted `Select` option now has an inset `focus.ring` outline as well as the `bg.subtle` fill, so keyboard navigation meets 3:1 non-text contrast (WCAG 1.4.11). The contrast gate checks `focus.ring` on `bg.surface` and `bg.subtle` in both themes.
