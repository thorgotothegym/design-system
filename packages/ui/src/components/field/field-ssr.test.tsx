import { renderToReadableStream } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  FIELD_STRUCTURES,
  StructuredName,
  danglingReferences,
  describesWithHelp,
  serverHtml,
} from "../../test/field-structures";

/**
 * Server HTML as a streaming server sends it once everything, a lazy part too, has rendered.
 *
 * This file only renders on the server. The streaming renderer leaves a development-only marker on
 * every context it renders, and a client renderer in the same process then warns about "multiple
 * renderers". A real app never shares a process between the two, so hydration is tested in
 * field.test.tsx from `renderToString`, which does not leave that marker. Vitest runs each file
 * in its own module graph.
 */
const streamedHtml = async (ui: ReactNode) => {
  const stream = await renderToReadableStream(ui);
  await stream.allReady;
  return new Response(stream).text();
};

describe("Field server HTML", () => {
  it.each(FIELD_STRUCTURES)(
    "should reference the description of $name as expected, never a missing id",
    async ({ part, server }) => {
      const container = serverHtml(
        await streamedHtml(<StructuredName>{part()}</StructuredName>),
      );

      expect(describesWithHelp(container)).toBe(server === "present");
      expect(danglingReferences(container)).toEqual([]);
      container.remove();
    },
  );
});
