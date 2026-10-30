/**
 * Finds Tailwind classes that remove the outline instead of making it transparent.
 *
 * In Tailwind 4, `outline-hidden` and `outline-none` set `outline-style: none` and also the
 * `--tw-outline-style` variable that `outline-2` reads. A focus variant such as
 * `focus-visible:outline-2 focus-visible:outline-focus-ring` on the same element then paints
 * nothing, and no tool reports it. This has hidden focus rings twice. Use `outline-transparent` on
 * an element that must not draw its own ring, and `outline-solid` in every focus variant.
 */

const REMOVAL = /^outline-(hidden|none)$/;

/** Removes the variants (`md:`, `data-[state=open]:`) and the important mark. */
const withoutVariants = (token: string): string => {
  let depth = 0;
  let start = 0;
  for (let index = 0; index < token.length; index += 1) {
    const character = token[index];
    if (character === "[" || character === "(") depth += 1;
    else if (character === "]" || character === ")") depth -= 1;
    else if (character === ":" && depth === 0) start = index + 1;
  }
  return token.slice(start).replace(/^!/, "").replace(/!$/, "");
};

/** The classes in `source` that remove the outline, with their variants. */
export const findOutlineRemoval = (source: string): string[] => {
  const tokens = source.split(/[\s"'`,{}();]+/).filter((token) => token !== "");

  return [
    ...new Set(tokens.filter((token) => REMOVAL.test(withoutVariants(token)))),
  ];
};
