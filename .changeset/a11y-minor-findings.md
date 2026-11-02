---
"@aleixvidal/ui": patch
---

`DatePicker` declares the language of its locale: when the locale (the `locale` prop, an enclosing React Aria `I18nProvider` or the browser's) is in a different language from the page, the field and the calendar get a `lang` attribute, so screen readers pronounce month and day names correctly. `Select` documents its `autoComplete` prop, which goes to the hidden native `<select>` rendered inside a form (for example `"country-name"`). The docs of `Slider`, `RadioGroup`, `DatePicker`, `Switch` and `Field` now describe label clicks, Home and End in a range slider, `required` around a switch, and partly filled dates.
