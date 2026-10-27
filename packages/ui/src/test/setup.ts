import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Component roots have no accessible role, but every one carries a permanent `data-slot` hook (also
// useful for consumers' CSS). Tests reach a root with `getByTestId`, which reads that attribute.
configure({ testIdAttribute: "data-slot" });

afterEach(() => {
  cleanup();
});
