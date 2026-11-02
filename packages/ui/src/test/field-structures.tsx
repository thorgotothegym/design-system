import { within } from "@testing-library/react";
import { Fragment, Suspense, forwardRef, lazy, memo } from "react";
import type { ComponentRef, ReactNode } from "react";
import { Checkbox } from "../components/checkbox";
import { Field } from "../components/field";
import { Input } from "../components/input";

/**
 * The ways real forms place a `Field.Description`, for the server and hydration tests of Field.
 * Each structure says whether the server HTML references the description ("present") or not
 * ("absent"), and what the page has after hydration. No structure may reference a missing id.
 */
export type FieldStructure = {
  name: string;
  part: () => ReactNode;
  server: "present" | "absent";
  hydrated: "present" | "absent";
};

const Help = () => <Field.Description>As on your passport.</Field.Description>;
const MemoHelp = memo(Help);
// A consumer component written with forwardRef, as older code bases do.
const RefHelp = forwardRef<ComponentRef<"p">>((_, ref) => (
  <Field.Description ref={ref}>As on your passport.</Field.Description>
));
const WithHelp = ({ render }: { render: () => ReactNode }) => render();

const helpModule = Promise.resolve({ default: Help });
/** Loads only when first rendered, as a code-split component does. */
export const LazyHelp = lazy(() => helpModule);

// Runtime values, so that the conditions below are real conditions and not constants.
const shown = (value: boolean) => value;

export const FIELD_STRUCTURES: FieldStructure[] = [
  {
    name: "a condition that is true",
    part: () => shown(true) && <Field.Description>Help</Field.Description>,
    server: "present",
    hydrated: "present",
  },
  {
    name: "a condition that is false",
    part: () => shown(false) && <Field.Description>Help</Field.Description>,
    server: "absent",
    hydrated: "absent",
  },
  {
    name: "a ternary between two descriptions",
    part: () =>
      shown(false) ? (
        <Field.Description>One</Field.Description>
      ) : (
        <Field.Description>Two</Field.Description>
      ),
    server: "present",
    hydrated: "present",
  },
  {
    name: "a ternary that picks nothing",
    part: () =>
      shown(false) ? <Field.Description>Help</Field.Description> : null,
    server: "absent",
    hydrated: "absent",
  },
  {
    name: "a ternary that picks a component of the consumer",
    part: () =>
      shown(true) ? <Help /> : <Field.Description>Help</Field.Description>,
    server: "absent",
    hydrated: "present",
  },
  {
    name: "null and false next to it",
    part: () => [
      null,
      false,
      <Field.Description key="help">Help</Field.Description>,
    ],
    server: "present",
    hydrated: "present",
  },
  {
    name: "an array from map",
    part: () =>
      ["help"].map((key) => (
        <Field.Description key={key}>Help</Field.Description>
      )),
    server: "present",
    hydrated: "present",
  },
  {
    name: "a fragment",
    part: () => (
      <>
        <Field.Description>Help</Field.Description>
      </>
    ),
    server: "present",
    hydrated: "present",
  },
  {
    name: "nested fragments, one with a key",
    part: () => (
      <>
        <Fragment key="inner">
          <>
            <Field.Description>Help</Field.Description>
          </>
        </Fragment>
      </>
    ),
    server: "present",
    hydrated: "present",
  },
  {
    name: "a component of the consumer",
    part: () => <Help />,
    server: "absent",
    hydrated: "present",
  },
  {
    name: "a memo component",
    part: () => <MemoHelp />,
    server: "absent",
    hydrated: "present",
  },
  {
    name: "a forwardRef component",
    part: () => <RefHelp />,
    server: "absent",
    hydrated: "present",
  },
  {
    name: "a render prop",
    part: () => <WithHelp render={() => <Help />} />,
    server: "absent",
    hydrated: "present",
  },
  {
    name: "a lazy component",
    part: () => (
      <Suspense fallback={null}>
        <LazyHelp />
      </Suspense>
    ),
    server: "absent",
    hydrated: "present",
  },
  {
    name: "a nested Field with its own description, in a fragment",
    part: () => (
      <>
        <Field id="news" orientation="horizontal">
          <Checkbox />
          <Field.Label>Send me news</Field.Label>
          <Field.Description>Once a month.</Field.Description>
        </Field>
      </>
    ),
    server: "absent",
    hydrated: "absent",
  },
];

/** A Name field whose description is placed by `children`. */
export const StructuredName = ({ children }: { children: ReactNode }) => (
  <Field id="name">
    <Field.Label>Name</Field.Label>
    <Input />
    {children}
  </Field>
);

/** The HTML a server sends, in a container of the page, as the browser parses it before hydration. */
export const serverHtml = (html: string) => {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  return container;
};

/**
 * Ids referenced by `aria-describedby` and `aria-labelledby` in `container` that no element in
 * the page has. Reading attributes and ids directly is the point of this check: a reference to a
 * missing id has no role or text to query by.
 */
export const danglingReferences = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll("[aria-describedby], [aria-labelledby]"),
  ).flatMap((element) =>
    ["aria-describedby", "aria-labelledby"]
      .flatMap((name) => (element.getAttribute(name) ?? "").split(" "))
      .filter((id) => id !== "" && document.getElementById(id) === null),
  );

/** Whether the Name input's `aria-describedby` references its description. */
export const describesWithHelp = (container: HTMLElement) =>
  (
    within(container).getByRole("textbox").getAttribute("aria-describedby") ??
    ""
  )
    .split(" ")
    .includes("name-description");
