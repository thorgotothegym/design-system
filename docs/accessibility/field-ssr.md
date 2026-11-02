# A11Y-09: Field wiring in server-rendered HTML

Evidence for the A11Y-09 fix (`fix/field-ssr-describedby`). It compares what the server sends with what the page has after hydration, for Field and every control inside a Field.

## Method

- **Server:** `renderToString` and `renderToPipeableStream` (`onAllReady`) from `react-dom/server`, run in plain Node with no DOM, importing `packages/ui/dist`. The cases are:
  - Field with an Input in three states: default, required, and invalid with an error;
  - each of the other controls (Textarea, Checkbox, Switch, RadioGroup, Select, Slider, TagInput, OtpInput, DatePicker) in two states: default, and required and invalid.

  Every case has a `Field.Label`, a `Field.Description` and a `Field.Error`. The RadioGroup options are each in their own horizontal Field, as documented. One more case wraps the description in a component of its own.

- **Client:** the server HTML is put in a jsdom page and hydrated with `hydrateRoot` in Vitest. `console.error`, `console.warn` and `onRecoverableError` are captured.
- **Comparison:** `id`, `for`, `aria-describedby`, `aria-labelledby`, `aria-invalid` and `aria-required` of every element, before and after hydration. Both server modes gave the same Field wiring. Each build has 44 server renders.

## Result

On `main` the server HTML already has `id`, `for`, `aria-invalid`, `aria-required`, and the error id when the field is invalid. Two things are missing until hydration:

- the `Field.Description` id, in the `aria-describedby` of all ten controls;
- `aria-labelledby` pointing at the `Field.Label`, on the group controls: RadioGroup, the Slider thumb, and the DatePicker group and its parts.

With the fix, both are in the server HTML. After hydration the DOM is the same as on `main` in all 44 cases.

Neither `main` nor the fix logged anything on the server. Hydration logged no console error or warning, and no recoverable error.

The table shows only the Field ids (`f-*`).

| Component                                 | State    | Server HTML on main                                       | Server HTML with the fix                                                   | After hydration (main and fix)                                             |
| ----------------------------------------- | -------- | --------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Input                                     | default  | describedby: none                                         | describedby: f-description                                                 | describedby: f-description                                                 |
| Input                                     | required | describedby: none, required                               | describedby: f-description, required                                       | describedby: f-description, required                                       |
| Input                                     | invalid  | describedby: f-error, invalid, required                   | describedby: f-description f-error, invalid, required                      | describedby: f-description f-error, invalid, required                      |
| Textarea                                  | default  | describedby: none                                         | describedby: f-description                                                 | describedby: f-description                                                 |
| Textarea                                  | invalid  | describedby: f-error, invalid, required                   | describedby: f-description f-error, invalid, required                      | describedby: f-description f-error, invalid, required                      |
| Checkbox                                  | default  | describedby: none                                         | describedby: f-description                                                 | describedby: f-description                                                 |
| Checkbox                                  | invalid  | describedby: f-error, invalid, required                   | describedby: f-description f-error, invalid, required                      | describedby: f-description f-error, invalid, required                      |
| Switch                                    | default  | describedby: none                                         | describedby: f-description                                                 | describedby: f-description                                                 |
| Switch                                    | invalid  | describedby: f-error, invalid                             | describedby: f-description f-error, invalid                                | describedby: f-description f-error, invalid                                |
| RadioGroup                                | default  | describedby: none, labelledby: none                       | describedby: f-description, labelledby: f-label                            | describedby: f-description, labelledby: f-label                            |
| RadioGroup                                | invalid  | describedby: f-error, labelledby: none, invalid, required | describedby: f-description f-error, labelledby: f-label, invalid, required | describedby: f-description f-error, labelledby: f-label, invalid, required |
| Select                                    | default  | describedby: none                                         | describedby: f-description                                                 | describedby: f-description                                                 |
| Select                                    | invalid  | describedby: f-error, invalid, required                   | describedby: f-description f-error, invalid, required                      | describedby: f-description f-error, invalid, required                      |
| Slider                                    | default  | describedby: none, labelledby: none                       | describedby: f-description, labelledby: f-label                            | describedby: f-description, labelledby: f-label                            |
| Slider                                    | invalid  | describedby: f-error, labelledby: none, invalid           | describedby: f-description f-error, labelledby: f-label, invalid           | describedby: f-description f-error, labelledby: f-label, invalid           |
| TagInput                                  | default  | describedby: none                                         | describedby: f-description                                                 | describedby: f-description                                                 |
| TagInput                                  | invalid  | describedby: f-error, invalid, required                   | describedby: f-description f-error, invalid, required                      | describedby: f-description f-error, invalid, required                      |
| OtpInput                                  | default  | describedby: none                                         | describedby: f-description                                                 | describedby: f-description                                                 |
| OtpInput                                  | invalid  | describedby: f-error, invalid, required                   | describedby: f-description f-error, invalid, required                      | describedby: f-description f-error, invalid, required                      |
| DatePicker                                | default  | describedby: none, labelledby: none                       | describedby: f-description, labelledby: f-label                            | describedby: f-description, labelledby: f-label                            |
| DatePicker                                | invalid  | describedby: f-error, labelledby: none                    | describedby: f-description f-error, labelledby: f-label                    | describedby: f-description f-error, labelledby: f-label                    |
| Input, description wrapped in a component | invalid  | describedby: f-error, invalid, required                   | describedby: f-error, invalid, required                                    | describedby: f-description f-error, invalid, required                      |

The DatePicker also changes some ids after hydration, on `main` and with the fix. These are React Aria's own ids (`react-aria-*`): React Aria references its label and description slots in the server HTML and fills them in after mount. That is React Aria's behavior, not the Field wiring.

The wrapped description is the one case that is still completed after mount, as on `main`. The Field cannot see a part inside another component while it renders, so that part registers itself when it mounts (see [Options](#options)).

### Server HTML, invalid Input

On `main`:

```html
<input
  id="f"
  aria-describedby="f-error"
  aria-invalid="true"
  aria-required="true"
  value="x"
/>
```

With the fix:

```html
<input
  id="f"
  aria-describedby="f-description f-error"
  aria-invalid="true"
  aria-required="true"
  value="x"
/>
```

### Server HTML, invalid RadioGroup

On `main`:

```html
<div
  role="radiogroup"
  aria-required="true"
  aria-orientation="vertical"
  dir="ltr"
  id="f"
  aria-describedby="f-error"
  aria-invalid="true"
  data-slot="radio-group"
  data-orientation="vertical"
  data-invalid="true"
  tabindex="-1"
  style="outline:none"
></div>
```

With the fix:

```html
<div
  role="radiogroup"
  aria-required="true"
  aria-orientation="vertical"
  dir="ltr"
  id="f"
  aria-labelledby="f-label"
  aria-describedby="f-description f-error"
  aria-invalid="true"
  data-slot="radio-group"
  data-orientation="vertical"
  data-invalid="true"
  tabindex="-1"
  style="outline:none"
></div>
```

## A reference to a missing id (Chrome 156, axe 4.14)

This test decides option (a). Each row is one control on a test page:

| Case                                                              | Chrome accessibility tree         | axe `aria-valid-attr-value`                                            |
| ----------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Input, `aria-describedby` to a missing id only                    | name "Email", no description      | **incomplete**: "ARIA attribute element ID does not exist on the page" |
| Input, `aria-describedby` to a missing id and an existing one     | description from the existing one | pass                                                                   |
| Radio group, `aria-labelledby` to a missing id, with `aria-label` | name from `aria-label` ("Plan")   | incomplete                                                             |
| Radio group, `aria-labelledby` to a missing id, no `aria-label`   | empty name                        | incomplete                                                             |
| Slider, `aria-labelledby` to a missing id, with `aria-label`      | name from `aria-label` ("Volume") | incomplete                                                             |

Chrome ignores a missing id, and axe reports no violation. But with option (a), every Field without a description would leave an axe "incomplete" (needs review) result.

## Options

|                    | (a) Always reference the ids                                                                                                                             | (b) Find the parts in `children` during render (chosen)                                                                                                                                                                                 | (c) Reference them on the server, correct after mount                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| How                | `aria-describedby` always lists `<id>-description`, and group controls always have `aria-labelledby` `<id>-label`. The registration effects are removed. | While it renders, Field looks through its `children` for `Field.Label` and `Field.Description`, including inside fragments but not inside nested Fields. The layout-effect registration stays, for a part wrapped in another component. | Assume a description and a label exist on the first render, then drop the reference after mount if none registered. |
| Server HTML        | Complete when the parts exist; a dangling reference when they do not.                                                                                    | Complete when the parts are children of the Field, as in every use in this repository. The same as `main` for a wrapped part.                                                                                                           | Complete when the parts exist; dangling until hydration when they do not.                                           |
| Hydration mismatch | None: both sides render the same.                                                                                                                        | None: both sides render the same. Measured: no warning in 44 cases.                                                                                                                                                                     | None, but the attributes change after hydration when a part is missing.                                             |
| axe                | **incomplete** on every Field without a description (see above).                                                                                         | No change: never a reference to a missing id.                                                                                                                                                                                           | Incomplete in the server HTML only.                                                                                 |
| Chrome tree        | Same names and descriptions, because missing ids are ignored.                                                                                            | Identical to `main` after hydration, in every story in both themes.                                                                                                                                                                     | Same after hydration.                                                                                               |
| Layout shift       | None.                                                                                                                                                    | None.                                                                                                                                                                                                                                   | None.                                                                                                               |
| Size               | Smaller: two effects are removed.                                                                                                                        | The `Field` entry is 105 B larger (9,886 to 9,991 B brotli). The control entries are unchanged, because they import only the state hook, not the Field root.                                                                            | About the same as `main`.                                                                                           |
| API                | No change.                                                                                                                                               | No change.                                                                                                                                                                                                                              | No change.                                                                                                          |

React 19 has no API that lets a later sibling register during render. `useId` gives stable ids, but it cannot tell whether the part exists. A component that renders before the description can only know about it in two ways: by reading its own children, or with a second pass after mount, which is what the current effect already does.

Option (b) is the smallest change that makes the server HTML complete for the documented structure without dangling references. It keeps the effect for a part wrapped in another component, so that case behaves as it does today.
