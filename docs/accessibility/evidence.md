# Accessibility audit: raw evidence

Recorded on 2026-11-02 by `scripts/a11y-audit.mts` (and the probes described in [accessibility.md](../accessibility.md)) against a static build of the Storybook (`STORYBOOK_PLAY_DELAY=0`), in Playwright's Chromium 1248 unless a section says otherwise. Each key press is a real `keyboard.press` with an 80 ms hold. These are observations, not a certification.

## Keyboard transcripts (dark theme)

Each line: the key, then where focus is (role, name and the component part), whether a focus indicator is painted, and the state read after the key.

### Input (`default`)

```text
Tab            input "Name" [input]                                         indicator     value=""
a              input "Name" [input]                                         indicator     value="a"
b              input "Name" [input]                                         indicator     value="ab"
Tab            (body)                                                       -             value="ab"
```

### Textarea (`default`)

```text
Tab            textarea "Message" [textarea]                                indicator     value=""
a              textarea "Message" [textarea]                                indicator     value="a"
Enter          textarea "Message" [textarea]                                indicator     value="a\n"
b              textarea "Message" [textarea]                                indicator     value="a\nb"
Tab            (body)                                                       -             value="a\nb"
```

### Field (`with-description`)

```text
Tab            input [input]                                                indicator
Tab            (body)                                                       -
```

### Checkbox (`with-label-and-description`)

```text
Tab            checkbox [checkbox]                                          indicator     checked=true value="on"
Space          checkbox [checkbox]                                          indicator     checked=false value="on"
Space          checkbox [checkbox]                                          indicator     checked=true value="on"
Tab            (body)                                                       -             checked=true value="on"
```

### Switch (`with-label-and-description`)

```text
Tab            switch [switch]                                              indicator     checked=false value="on"
Space          switch [switch]                                              indicator     checked=true value="on"
Enter          switch [switch]                                              indicator     checked=false value="on"
Tab            (body)                                                       -             checked=false value="on"
```

### RadioGroup (`default`)

```text
Tab            radio [radio-group-item]                                     indicator     checked="(none)"
ArrowDown      radio [radio-group-item]                                     indicator     checked="ProUnlimited projects and"
ArrowDown      radio [radio-group-item]                                     indicator     checked="TeamShared billing and ro"
ArrowUp        radio [radio-group-item]                                     indicator     checked="ProUnlimited projects and"
Tab            (body)                                                       -             checked="ProUnlimited projects and"
```

### Select (`default`)

```text
Tab            combobox "Country" [select]                                  indicator     expanded=false value=""
Enter          option "Spain" [select-item]                                 indicator     expanded=true value=""
ArrowDown      option "Portugal" [select-item]                              indicator     expanded=true value=""
End            option "Canada" [select-item]                                indicator     expanded=true value=""
Home           option "Spain" [select-item]                                 indicator     expanded=true value=""
Escape         combobox "Country" [select]                                  indicator     expanded=false value=""
Space          option "Spain" [select-item]                                 indicator     expanded=true value=""
ArrowDown      option "Portugal" [select-item]                              indicator     expanded=true value=""
Enter          combobox "Country" [select]                                  indicator     expanded=false value=""
s              combobox "Country" [select]                                  indicator     expanded=false value=""
Tab            (body)                                                       -             expanded=false value=""
```

### Slider (`range`)

```text
Tab            slider "Price Minimum" [slider-thumb]                        indicator     20,80
ArrowRight     slider "Price Minimum" [slider-thumb]                        indicator     21,80
PageUp         slider "Price Minimum" [slider-thumb]                        indicator     31,80
Home           slider "Price Minimum" [slider-thumb]                        indicator     0,80
End            slider "Price Maximum" [slider-thumb]                        indicator     0,100
Tab            (body)                                                       -             0,100
ArrowLeft      (body)                                                       -             0,100
Tab            slider "Price Minimum" [slider-thumb]                        indicator     0,100
```

### TagInput (`default`)

```text
Tab            input "Skills" [tag-input]                                   indicator     tags=[] status=""
r              input "Skills" [tag-input]                                   indicator     tags=[] status=""
Enter          input "Skills" [tag-input]                                   indicator     tags=[r] status="r added, 1 tag"
c              input "Skills" [tag-input]                                   indicator     tags=[r] status="r added, 1 tag"
Comma          input "Skills" [tag-input]                                   indicator     tags=[r,c] status="c added, 2 tags"
Shift+Tab      button "Remove r" [tag-input-remove]                         indicator     tags=[r,c] status="c added, 2 tags"
ArrowRight     button "Remove c" [tag-input-remove]                         indicator     tags=[r,c] status="c added, 2 tags"
Delete         button "Remove r" [tag-input-remove]                         indicator     tags=[r] status="c removed, 1 tag"
Tab            input "Skills" [tag-input]                                   indicator     tags=[r] status="c removed, 1 tag"
Backspace      input "Skills" [tag-input]                                   indicator     tags=[] status="r removed, 0 tags"
Tab            (body)                                                       -             tags=[] status="r removed, 0 tags"
```

### Realistic form (`default`)

```text
Tab            input [input]                                                indicator
Tab            input [input]                                                indicator
Tab            textarea [textarea]                                          indicator
Tab            radio [radio-group-item]                                     indicator
Tab            combobox "Choose a country" [select]                         indicator
Tab            spinbutton "month, " [date-picker-segment]                   indicator
Tab            spinbutton "day, " [date-picker-segment]                     indicator
Tab            spinbutton "year, " [date-picker-segment]                    indicator
Tab            button "Calendar" [date-picker-button]                       indicator
Tab            input [tag-input]                                            indicator
Tab            slider "Experience with design systems" [slider-thumb]       indicator
Tab            switch [switch]                                              indicator
Tab            checkbox [checkbox]                                          indicator
Tab            button "Register"                                            indicator
Tab            (body)                                                       -
Tab            input [input]                                                indicator
Tab            input [input]                                                indicator
Tab            textarea [textarea]                                          indicator
Tab            radio [radio-group-item]                                     indicator
Tab            combobox "Choose a country" [select]                         indicator
Tab            spinbutton "month, " [date-picker-segment]                   indicator
Tab            spinbutton "day, " [date-picker-segment]                     indicator
Tab            spinbutton "year, " [date-picker-segment]                    indicator
Tab            button "Calendar" [date-picker-button]                       indicator
```

### DatePicker (`with-value`)

```text
(start)        spinbutton "month, Start date" [date-picker-segment]         indicator     field="3/12/2025" dialog=closed
Tab            spinbutton "day, Start date" [date-picker-segment]           indicator     field="3/12/2025" dialog=closed
Tab            spinbutton "year, Start date" [date-picker-segment]          indicator     field="3/12/2025" dialog=closed
Tab            button "Calendar" [date-picker-button]                       indicator     field="3/12/2025" dialog=closed
Enter          button "Wednesday, March 12, 2025 selected" [date-picker-cal indicator     field="3/12/2025" dialog=open
ArrowRight     button "Thursday, March 13, 2025" [date-picker-calendar]     indicator     field="3/12/2025" dialog=open
ArrowDown      button "Thursday, March 20, 2025" [date-picker-calendar]     indicator     field="3/12/2025" dialog=open
PageDown       button "Sunday, April 20, 2025" [date-picker-calendar]       indicator     field="3/12/2025" dialog=open
Escape         button "Calendar" [date-picker-button]                       indicator     field="3/12/2025" dialog=closed
Shift+Tab      spinbutton "year, Start date" [date-picker-segment]          indicator     field="3/12/2025" dialog=closed
Alt+ArrowDown  button "Wednesday, March 12, 2025 selected" [date-picker-cal indicator     field="3/12/2025" dialog=open
Enter          spinbutton "year, Start date" [date-picker-segment]          indicator     field="3/12/2025" dialog=closed
Tab            button "Calendar" [date-picker-button]                       indicator     field="3/12/2025" dialog=closed
```

### OtpInput (`default`)

```text
(start)        (body)                                                       -             value=""
Tab            input "Verification code" [otp-input]                        indicator     value=""
1              input "Verification code" [otp-input]                        indicator     value="1"
2              input "Verification code" [otp-input]                        indicator     value="12"
Backspace      input "Verification code" [otp-input]                        indicator     value="1"
Tab            (body)                                                       -             value="1"
```

Results for both themes: no keyboard trap in any of the 12 scenarios; a focus indicator on every focused stop; no focused element covered by another element (`elementFromPoint` at its centre). The OtpInput indicator is the outline of the active box, which is beside the transparent `<input>`, not around it.

## Accessibility tree extracts

Playwright aria snapshots of the story root. States that the snapshot format omits (`required`, `aria-describedby`) are listed under each one from the DOM.

### Realistic form (`with-errors`)

```yaml
- form "Register for Interface Week":
    - region "Fix 7 problems to continue":
        - heading "Fix 7 problems to continue" [level=2]
        - list:
            - listitem:
                - link "Enter your full name":
                    - /url: "#registration-fullName"
            - listitem:
                - link "Enter your email address":
                    - /url: "#registration-email"
            - listitem:
                - link "Choose a ticket type":
                    - /url: "#registration-ticket"
            - listitem:
                - link "Choose your country":
                    - /url: "#registration-country"
            - listitem:
                - link "Enter a complete date (month, day and year)":
                    - /url: "#registration-arrival"
            - listitem:
                - link "Add at least one interest":
                    - /url: "#registration-interests"
            - listitem:
                - link "Accept the terms to register":
                    - /url: "#registration-terms"
    - group "About you":
        - text: About you Full name
        - textbox "Full name" [invalid]
        - paragraph: Enter your full name
        - text: Email
        - textbox "Email" [invalid]
        - paragraph: We send your ticket here.
        - paragraph: Enter your email address
        - text: Short bio
        - textbox "Short bio"
        - paragraph: Optional. Shown on your badge page, up to 280 characters.
        - paragraph
    - group "Your ticket":
        - text: Your ticket Ticket type
        - radiogroup "Ticket type" [invalid]:
            - radio "Standard"
            - text: Standard
            - paragraph: In person, all five days.
            - radio "Student"
            - text: Student
            - paragraph: In person, with a valid student card.
            - radio "Online"
            - text: Online
            - paragraph: Live stream and recordings only.
        - paragraph: Choose a ticket type
        - text: Country
        - combobox "Country" [invalid]: Choose a country
        - paragraph: For your invoice.
        - paragraph: Choose your country
        - text: Arrival date
        - group "Arrival date":
            - spinbutton "month, Arrival date" [invalid]: "3"
            - spinbutton "day, Arrival date" [invalid]: dd
            - spinbutton "year, Arrival date" [invalid]: yyyy
            - button "Calendar Arrival date"
        - paragraph: From March 13, 2027 to March 19, 2027.
        - paragraph: Enter a complete date (month, day and year)
    - group "Preferences":
        - text: Preferences Interests
        - textbox "Interests" [invalid]:
            - /placeholder: Design systems
        - status
        - paragraph: Up to 5. Press Enter or a comma after each one.
        - paragraph: Add at least one interest
        - text: Experience with design systems
        - slider "Experience with design systems"
        - paragraph: 1 is new to them, 5 is building one.
        - paragraph
        - switch "Email me about the programme"
        - text: Email me about the programme
        - paragraph: At most one email a week.
        - checkbox "I accept the terms of attendance" [invalid]
        - text: I accept the terms of attendance
        - paragraph: Accept the terms to register
    - button "Register"
    - status
```

- `- textbox "Full name" [invalid]` states {"invalid": "true", "required": "true"}; description: Enter your full name
- `- textbox "Email" [invalid]` states {"invalid": "true", "required": "true"}; description: We send your ticket here. / Enter your email address
- `- textbox "Short bio"` states {}; description: Optional. Shown on your badge page, up to 280 characters.
- `- radiogroup "Ticket type" [invalid]:` states {"invalid": "true", "required": "true"}; description: Choose a ticket type
- `- radio "Standard"` states {"checked": "false"}; description: In person, all five days.
- `- radio "Student"` states {"checked": "false"}; description: In person, with a valid student card.
- `- radio "Online"` states {"checked": "false"}; description: Live stream and recordings only.
- `- combobox "Country" [invalid]: Choose a country` states {"invalid": "true", "required": "true", "expanded": "false"}; description: For your invoice. / Choose your country
- `- group "Arrival date":` states {}; description: From March 13, 2027 to March 19, 2027. / Enter a complete date (month, day and year)
- `- spinbutton "month, Arrival date" [invalid]: "3"` states {"invalid": "true", "required": "true", "valuenow": "3", "valuetext": "3 \u2013 March"}; description: From March 13, 2027 to March 19, 2027. / Enter a complete date (month, day and year)
- `- spinbutton "day, Arrival date" [invalid]: dd` states {"invalid": "true", "required": "true", "valuetext": "Empty"}; description: From March 13, 2027 to March 19, 2027. / Enter a complete date (month, day and year)
- `- spinbutton "year, Arrival date" [invalid]: yyyy` states {"invalid": "true", "required": "true", "valuetext": "Empty"}; description: From March 13, 2027 to March 19, 2027. / Enter a complete date (month, day and year)
- `- button "Calendar Arrival date"` states {"expanded": "false"}; description: From March 13, 2027 to March 19, 2027. / Enter a complete date (month, day and year)
- `- textbox "Interests" [invalid]:` states {"invalid": "true", "required": "true"}; description: Up to 5. Press Enter or a comma after each one. / Add at least one interest
- `- slider "Experience with design systems"` states {"valuenow": "3", "valuetext": "3 of 5"}; description: 1 is new to them, 5 is building one.
- `- switch "Email me about the programme"` states {"checked": "false"}; description: At most one email a week.
- `- checkbox "I accept the terms of attendance" [invalid]` states {"invalid": "true", "required": "true", "checked": "false"}; description: Accept the terms to register
- `- button "Register"` states {}; description: none

### DatePicker (`invalid`)

```yaml
- text: Start date
- group "Start date":
    - spinbutton "month, Start date" [invalid]: "3"
    - spinbutton "day, Start date" [invalid]: "12"
    - spinbutton "year, Start date" [invalid]: "2025"
    - button "Calendar Start date"
- paragraph: The course is full on this date.
```

- `- group "Start date":` states {}; description: Selected Date: March 12, 2025 / The course is full on this date.
- `- spinbutton "month, Start date" [invalid]: "3"` states {"invalid": "true", "valuenow": "3", "valuetext": "3 \u2013 March"}; description: Selected Date: March 12, 2025 / The course is full on this date.
- `- spinbutton "day, Start date" [invalid]: "12"` states {"invalid": "true", "valuenow": "12", "valuetext": "12"}; description: Selected Date: March 12, 2025 / The course is full on this date.
- `- spinbutton "year, Start date" [invalid]: "2025"` states {"invalid": "true", "valuenow": "2025", "valuetext": "2025"}; description: Selected Date: March 12, 2025 / The course is full on this date.
- `- button "Calendar Start date"` states {"expanded": "false"}; description: Selected Date: March 12, 2025 / The course is full on this date.

### RadioGroup (`invalid`)

```yaml
- text: Plan
- radiogroup "Plan" [invalid]:
    - radio "Free"
    - text: Free
    - paragraph: One project, community support.
    - radio "Pro"
    - text: Pro
    - paragraph: Unlimited projects and history.
    - radio "Team"
    - text: Team
    - paragraph: Shared billing and roles.
- paragraph: You can change it at any time.
- paragraph: Choose a plan to continue
```

- `- radiogroup "Plan" [invalid]:` states {"invalid": "true", "required": "true"}; description: You can change it at any time. / Choose a plan to continue
- `- radio "Free"` states {"checked": "false"}; description: One project, community support.
- `- radio "Pro"` states {"checked": "false"}; description: Unlimited projects and history.
- `- radio "Team"` states {"checked": "false"}; description: Shared billing and roles.

### Field (`with-error`)

```yaml
- text: Email
- textbox "Email" [invalid]: not-an-email
- paragraph: We only use it to send the receipt.
- paragraph: Enter a valid email address
```

- `- textbox "Email" [invalid]: not-an-email` states {"invalid": "true"}; description: We only use it to send the receipt. / Enter a valid email address

## Server render (React `renderToString`, before hydration)

```html
<input
  id="_R_0_"
  aria-required="true"
  class="m-0 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-inherit outline-transparent [font:inherit] placeholder:text-text-placeholder disabled:cursor-not-allowed"
/>
```

The `<input>` of a `Field` with a `Field.Description` has no `aria-describedby` in the server HTML. After hydration the client adds it (the description registers in a layout effect).

A `required` `Field` around a `Switch`:

```html
<label
  data-slot="field-label"
  id="_R_0_-label"
  for="_R_0_"
  class="box-border font-mono text-sm font-medium text-text-default in-data-disabled:text-text-muted in-data-[orientation=horizontal]:self-center"
  >Email notifications<span aria-hidden="true" class="text-text-danger">
    *</span
  ></label
>
<button
  type="button"
  role="switch"
  aria-checked="false"
  data-state="unchecked"
  value="on"
  id="_R_0_"
  data-slot="switch"
  class="m-0 box-border inline-flex h-6 w-12 shrink-0 appearance-none items-center rounded-lg border border-border-control bg-bg-input p-px not-data-invalid:not-data-disabled:hover:border-brand-primary not-data-invalid:not-data-disabled:active:border-brand-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring not-data-disabled:data-[state=checked]:bg-brand-primary not-data-disabled:not-data-invalid:data-[state=checked]:border-brand-primary data-invalid:border-border-danger data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle motion-safe:transition-[border-color]"
></button>
```

The label shows the required marker (hidden from assistive technology with `aria-hidden`); the switch has no `aria-required`.

## Known items

```text
Slider (with-field): clicking the Field.Label
  {"focusAfterClick": "(body)"}
RadioGroup (default): clicking the Field.Label
  {"focusAfterClick": "(body)"}
DatePicker (in-field): clicking the Field.Label
  {"focusAfterClick": "(body)"}
DatePicker (controlled): partially cleared date: invalid indicator?
  {"segments": "3/dd(placeholder)/2025", "groupInvalid": null, "anySegmentInvalid": false, "reported": "Value: (none)"}
Select (default): aria-hidden-focus: flagged nodes vs where Tab and Shift+Tab can go
  {"axeFlagged": ["#storybook-root"], "focusStopsWhileOpen": ["option \"Spain\" [select-item]"], "focusEverInsideAriaHidden": false}
DatePicker (calendar-states): aria-hidden-focus: flagged nodes vs where Tab and Shift+Tab can go
  {"axeFlagged": [], "focusStopsWhileOpen": ["button \"Wednesday, March 12, 2025 selected\" [date-picker-calendar]"], "focusEverInsideAriaHidden": false}
```

## Slider: Home and End on a range (probe)

```text
slider start:            Price Minimum=20 (focused)   Price Maximum=80
End on the min thumb:    Price Minimum=20             Price Maximum=100 (focused)
then ArrowLeft:          Price Minimum=20             Price Maximum=99 (focused)
```

Radix Slider 1.6.1 (`dist/index.mjs`): `onHomeKeyDown` calls `updateValues(min, 0)` and `onEndKeyDown` calls `updateValues(max, values.length - 1)`: Home always moves the first thumb and End the last, whichever thumb has focus, and focus follows the moved thumb.

## DatePicker: a click on empty page space (probe)

Story `with-value` (a DatePicker on its own, no `Field`), one click with the real mouse on an empty point, then where focus is:

```text
Chromium  click (1,1) on BODY      -> month segment
Chromium  click (500,700) on HTML  -> year segment
Firefox   click (1,1) on BODY      -> body
Firefox   click (500,700) on HTML  -> body
WebKit    click (1,1) on BODY      -> month segment
WebKit    click (500,700) on HTML  -> year segment
```

The same clicks on the `in-field` story and on an `Input` story leave focus on the body. The date segments are `contenteditable` (React Aria), and Blink and WebKit place the caret in the nearest editable element when the page root is clicked.

## OtpInput: paste and autofill (3.3.8)

```text
paste "482913" (3.3.8): {"attrs": {"autocomplete": "one-time-code", "inputmode": "numeric", "maxlength": "6", "type": "text"}, "valueAfterPaste": "482913"}
paste "482 913" (3.3.8): {"attrs": {"autocomplete": "one-time-code", "inputmode": "numeric", "maxlength": "6", "type": "text"}, "valueAfterPaste": "482913"}
```

## Realistic form: autocomplete (1.3.5)

| Control                          | autocomplete |
| -------------------------------- | ------------ |
| Full name (input)                | name         |
| Email (input)                    | email        |
| Short bio (textarea)             | (none)       |
| Country (combobox)               | (none)       |
| month, Arrival date (spinbutton) | (none)       |
| day, Arrival date (spinbutton)   | (none)       |
| year, Arrival date (spinbutton)  | (none)       |
| Calendar Arrival date (button)   | (none)       |
| Interests (input)                | (none)       |
| Register (button)                | (none)       |

Form-associated hidden controls (Radix renders a native control for form submission):

```text
{"tag": "input", "name": "ticket", "autocomplete": null}
{"tag": "input", "name": "ticket", "autocomplete": null}
{"tag": "input", "name": "ticket", "autocomplete": null}
{"tag": "select", "name": "country", "autocomplete": null}
{"tag": "input", "name": null, "autocomplete": null}
{"tag": "input", "name": "arrival", "autocomplete": null}
{"tag": "input", "name": "updates", "autocomplete": null}
{"tag": "input", "name": "terms", "autocomplete": null}
```

## Cross-browser (Playwright Chromium 1248, Firefox 157.0, WebKit 27.2)

```text
chromium  Textarea: autoGrow follows the text
  {"before": 96, "after": 210}
chromium  Realistic form: Tab order
  ["input [input]", "input [input]", "textarea [textarea]", "radio [radio-group-item]", "combobox \"Choose a country\" [select]", "spinbutton \"month, \" [date-picker-segment]", "spinbutton \"day, \" [date-picker-segment]", "spinbutton \"year, \" [date-picker-segment]", "button \"Calendar\" [date-pick
chromium  Realistic form: console clean
  []
chromium  Select: Enter opens, Escape closes and returns focus
  {"opened": 1, "focusAfterEscape": "combobox \"Country\" [select]"}
chromium  DatePicker: Alt+Down opens the calendar on the day, Escape returns focus
  {"opened": 1, "focusInCalendar": "button \"Wednesday, March 12, 2025 selected\" [date-picker-calendar]", "focusAfterEscape": "spinbutton \"day, Start date\" [date-picker-segment]"}
firefox   Textarea: autoGrow follows the text
  {"before": 96, "after": 210}
firefox   Realistic form: Tab order
  ["input [input]", "input [input]", "textarea [textarea]", "radio [radio-group-item]", "combobox \"Choose a country\" [select]", "spinbutton \"month, \" [date-picker-segment]", "spinbutton \"day, \" [date-picker-segment]", "spinbutton \"year, \" [date-picker-segment]", "button \"Calendar\" [date-pick
firefox   Realistic form: console clean
  []
firefox   Select: Enter opens, Escape closes and returns focus
  {"opened": 1, "focusAfterEscape": "combobox \"Country\" [select]"}
firefox   DatePicker: Alt+Down opens the calendar on the day, Escape returns focus
  {"opened": 1, "focusInCalendar": "button \"Wednesday, March 12, 2025 selected\" [date-picker-calendar]", "focusAfterEscape": "spinbutton \"day, Start date\" [date-picker-segment]"}
webkit    Textarea: autoGrow follows the text
  {"before": 96, "after": 210}
webkit    Realistic form: Tab order
  ["input [input]", "input [input]", "textarea [textarea]", "radio [radio-group-item]", "spinbutton \"month, \" [date-picker-segment]", "spinbutton \"day, \" [date-picker-segment]", "spinbutton \"year, \" [date-picker-segment]", "button \"Calendar\" [date-picker-button]", "input [tag-input]", "slider
webkit    Realistic form: console clean
  []
webkit    Select: Enter opens, Escape closes and returns focus
  {"opened": 1, "focusAfterEscape": "combobox \"Country\" [select]"}
webkit    DatePicker: Alt+Down opens the calendar on the day, Escape returns focus
  {"opened": 1, "focusInCalendar": "button \"Wednesday, March 12, 2025 selected\" [date-picker-calendar]", "focusAfterEscape": "spinbutton \"day, Start date\" [date-picker-segment]"}
```

In WebKit the Select is reached with Option+Tab: WebKit, like Safari by default, tabs only to text fields, so plain Tab skips buttons (the Select trigger, the switch, the checkbox and the submit button in the Tab order above). That is the browser setting, not the component; with Option+Tab, or with the Safari setting Press Tab to highlight each item turned on, every control is reached.

## Reflow, text resize and text spacing

| Component      | Story                      | Mode         | Horizontal scroll | Clipped text |
| -------------- | -------------------------- | ------------ | ----------------- | ------------ |
| Input          | default                    | 320px        | no                | none         |
| Input          | default                    | text 200%    | no                | none         |
| Input          | default                    | text spacing | no                | none         |
| Textarea       | default                    | 320px        | no                | none         |
| Textarea       | default                    | text 200%    | no                | none         |
| Textarea       | default                    | text spacing | no                | none         |
| Field          | with-description           | 320px        | no                | none         |
| Field          | with-description           | text 200%    | no                | none         |
| Field          | with-description           | text spacing | no                | none         |
| Checkbox       | with-label-and-description | 320px        | no                | none         |
| Checkbox       | with-label-and-description | text 200%    | no                | none         |
| Checkbox       | with-label-and-description | text spacing | no                | none         |
| Switch         | with-label-and-description | 320px        | no                | none         |
| Switch         | with-label-and-description | text 200%    | no                | none         |
| Switch         | with-label-and-description | text spacing | no                | none         |
| RadioGroup     | default                    | 320px        | no                | none         |
| RadioGroup     | default                    | text 200%    | no                | none         |
| RadioGroup     | default                    | text spacing | no                | none         |
| Select         | default                    | 320px        | no                | none         |
| Select         | default                    | text 200%    | no                | none         |
| Select         | default                    | text spacing | no                | none         |
| Slider         | with-field                 | 320px        | no                | none         |
| Slider         | with-field                 | text 200%    | no                | none         |
| Slider         | with-field                 | text spacing | no                | none         |
| TagInput       | with-field                 | 320px        | no                | none         |
| TagInput       | with-field                 | text 200%    | no                | none         |
| TagInput       | with-field                 | text spacing | no                | none         |
| OtpInput       | default                    | 320px        | no                | none         |
| OtpInput       | default                    | text 200%    | no                | none         |
| OtpInput       | default                    | text spacing | no                | none         |
| DatePicker     | in-field                   | 320px        | no                | none         |
| DatePicker     | in-field                   | text 200%    | no                | none         |
| DatePicker     | in-field                   | text spacing | no                | none         |
| Realistic form | with-errors                | 320px        | no                | none         |
| Realistic form | with-errors                | text 200%    | no                | none         |
| Realistic form | with-errors                | text spacing | no                | none         |

Text at 200 % (root font size), realistic form `with-errors`: label 14 → 28 px, input text 16 → 32 px, field box height 24 → 48 px, no horizontal scroll.

## Forced colors and reduced motion (Chromium, `forcedColors: 'active'`, `reducedMotion: 'reduce'`)

```text
Input: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 1px auto", "obscured": false}
Input: forced colors: control boundaries -> [{"slot": "input", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}]
Input: reduced motion: no animation or transition running after focus -> []
Textarea: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 2px solid", "obscured": false}
Textarea: forced colors: control boundaries -> [{"slot": "textarea", "border": "1px solid", "borderColor": "rgba(55, 0, 110, 0.8)"}]
Textarea: reduced motion: no animation or transition running after focus -> []
Field: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 1px auto", "obscured": false}
Field: forced colors: control boundaries -> [{"slot": "input", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}]
Field: reduced motion: no animation or transition running after focus -> []
Checkbox: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 2px solid", "obscured": false}
Checkbox: forced colors: control boundaries -> [{"slot": "checkbox", "border": "1px solid", "borderColor": "rgba(55, 0, 110, 0.8)"}]
Checkbox: reduced motion: no animation or transition running after focus -> []
Switch: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 2px solid", "obscured": false}
Switch: forced colors: control boundaries -> [{"slot": "switch", "border": "1px solid", "borderColor": "rgba(55, 0, 110, 0.8)"}]
Switch: reduced motion: no animation or transition running after focus -> []
RadioGroup: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 2px solid", "obscured": false}
RadioGroup: forced colors: control boundaries -> [{"slot": "radio-group-item", "border": "1px solid", "borderColor": "rgba(55, 0, 110, 0.8)"}, {"slot": "radio-group-item", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}, {"slot": "radio-group-item", "border": "1p
RadioGroup: reduced motion: no animation or transition running after focus -> []
Select: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 2px solid", "obscured": false}
Select: forced colors: control boundaries -> [{"slot": "select", "border": "1px solid", "borderColor": "rgba(55, 0, 110, 0.8)"}]
Select: reduced motion: no animation or transition running after focus -> []
Slider: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 2px solid", "obscured": false}
Slider: forced colors: control boundaries -> [{"slot": "slider-track", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}]
Slider: reduced motion: no animation or transition running after focus -> []
TagInput: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 1px auto", "obscured": false}
TagInput: forced colors: control boundaries -> [{"slot": "tag-input", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}]
TagInput: reduced motion: no animation or transition running after focus -> []
OtpInput: forced colors: focus indicator painted -> {"visible": true, "by": "active box outline 2px solid", "obscured": false}
OtpInput: forced colors: control boundaries -> [{"slot": "otp-input-slot", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}, {"slot": "otp-input-slot", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}, {"slot": "otp-input-slot", "border": "1px solid", "bord
OtpInput: reduced motion: no animation or transition running after focus -> []
DatePicker: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 1px auto", "obscured": false}
DatePicker: forced colors: control boundaries -> [{"slot": "date-picker-field", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}]
DatePicker: reduced motion: no animation or transition running after focus -> []
Realistic form: forced colors: focus indicator painted -> {"visible": true, "by": "element outline 1px auto", "obscured": false}
Realistic form: forced colors: control boundaries -> [{"slot": "input", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}, {"slot": "input", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"}, {"slot": "textarea", "border": "1px solid", "borderColor": "rgb(0, 0, 0)"
Realistic form: reduced motion: no animation or transition running after focus -> []
```
