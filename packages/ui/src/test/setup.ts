import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Component roots have no accessible role, but every one carries a permanent `data-slot` hook (also
// useful for consumers' CSS). Tests reach a root with `getByTestId`, which reads that attribute.
configure({ testIdAttribute: "data-slot" });

// jsdom has no ResizeObserver, and Radix controls that render a hidden form input (Checkbox, Switch)
// observe its size. A browser API missing from the test environment is the kind of edge to stub.
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
});
