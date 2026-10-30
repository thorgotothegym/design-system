---
"@aleixvidal/ui": minor
---

Add the `OtpInput` component for one-time codes, built on `input-otp`: one text input with `autocomplete="one-time-code"` (so an SMS code can be filled in from the keyboard) drawn as one box per character, announced once as a single field. Pasting a whole code fills every box (spaces and hyphens are removed), `onComplete` fires once when it is full, `type` is `numeric` or `alphanumeric`, `groups` splits the boxes and throws in development when the sizes do not add up to `length`, and it works inside a `Field` and with react-hook-form. It accepts a `nonce` for a strict Content-Security-Policy.
