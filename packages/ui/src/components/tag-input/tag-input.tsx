import * as RovingFocusGroup from "@radix-ui/react-roving-focus";
import { useEffect, useRef, useState } from "react";
import type {
  ClipboardEvent,
  ComponentPropsWithRef,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

const count = (tags: number) => `${tags} ${tags === 1 ? "tag" : "tags"}`;

export type TagInputMessages = {
  /** Name of the list of added tags. It is not rendered while there are no tags. */
  listLabel: string;
  /** Name of the button that removes a tag. */
  remove: (tag: string) => string;
  /** Announced after one tag is added. */
  added: (tag: string, total: number) => string;
  /** Announced after several tags are added at once, for example by pasting. */
  addedMany: (added: number, total: number) => string;
  /** Announced after a tag is removed. */
  removed: (tag: string, total: number) => string;
  /** Announced when a tag is rejected because it is already in the list. */
  duplicate: (tag: string) => string;
  /** Announced when a tag is rejected because the maximum is reached. */
  max: (max: number) => string;
};

const DEFAULT_MESSAGES: TagInputMessages = {
  listLabel: "Added tags",
  remove: (tag) => `Remove ${tag}`,
  added: (tag, total) => `${tag} added, ${count(total)}`,
  addedMany: (added, total) => `${count(added)} added, ${count(total)}`,
  removed: (tag, total) => `${tag} removed, ${count(total)}`,
  duplicate: (tag) => `${tag} is already added`,
  max: (max) => `Maximum of ${count(max)} reached`,
};

/** Typing a comma adds the tag; pasting text with commas, new lines or tabs adds several at once. */
const SEPARATORS = /[,\n\r\t]+/;

/**
 * The drawn box, as in `Input`: border, background and focus ring live on the box, which holds the
 * tags and the text input. The ring shows for the input only (`:focus-visible`); a tag's button
 * has its own. States are `data-*` attributes styled with Tailwind data variants.
 */
const boxClasses = [
  "box-border flex min-h-10 w-full flex-wrap items-center gap-2 rounded-lg border border-border-control bg-bg-input px-3 py-1 font-mono text-md text-text-default",
  "not-data-invalid:not-data-disabled:not-data-readonly:hover:border-brand-primary",
  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring",
  "data-invalid:border-border-danger",
  "data-readonly:bg-bg-subtle",
  "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle data-disabled:text-text-muted",
  "motion-safe:transition-[border-color]",
];

const chipClasses =
  "m-0 box-border inline-flex h-6 items-center rounded-md border border-border-control bg-bg-subtle pl-2 text-sm text-text-default in-data-disabled:text-text-muted list-none";

const removeClasses = [
  "m-0 box-border inline-flex size-6 shrink-0 cursor-pointer appearance-none items-center justify-center border-0 bg-transparent p-0 text-text-muted",
  "not-disabled:hover:text-text-danger",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
  "disabled:cursor-not-allowed",
];

export type TagInputProps = Omit<
  ComponentPropsWithRef<"input">,
  "value" | "defaultValue" | "size" | "type"
> & {
  /** Controlled tags. */
  value?: string[];
  /** Initial tags when the component manages its own state. */
  defaultValue?: string[];
  /** Called with the new list of tags whenever one is added or removed. */
  onValueChange?: (value: string[]) => void;
  /** The most tags allowed. Past it, adding is rejected with an announcement; the input stays enabled. */
  max?: number;
  /** Allow the same tag more than once. Without it, comparison ignores case and surrounding spaces. */
  allowDuplicates?: boolean;
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
  /** Texts announced to screen readers and used as names, to translate or reword them. */
  messages?: Partial<TagInputMessages>;
};

/**
 * A text field that turns what is typed into removable tags. Use it for a free list of short
 * values such as keywords or email recipients; use a Select for a closed set of choices and a
 * Textarea for prose.
 *
 * Enter or a comma adds the tag; pasting text with commas or new lines adds several. Backspace in an
 * empty input removes the last tag. The tags are a list of chips, each with a button to remove it;
 * the buttons are one tab stop and the arrow keys move between them, and Backspace or Delete on one
 * removes it. The list is not rendered while it is empty. Additions, removals and rejected
 * duplicates are announced through one polite status region; the input stays enabled at the
 * maximum and rejects with an announcement.
 *
 * Inside a `Field` it is labelled, described and validated automatically; on its own it needs an
 * `aria-label` or an external label. All native `<input>` attributes are accepted and forwarded to
 * the `<input>`, except `value`, `defaultValue`, `size` and `type`, which are replaced by the props
 * above. `name` goes to a hidden input per tag, so a native form submits every tag under it. `ref`
 * goes to the text `<input>`; `className` goes to the box around it.
 */
export const TagInput = ({
  value,
  defaultValue,
  onValueChange,
  max,
  allowDuplicates = false,
  invalid,
  messages,
  className,
  disabled,
  readOnly,
  name,
  ref,
  onKeyDown,
  onPaste,
  onChange,
  ...props
}: TagInputProps) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });
  const text = { ...DEFAULT_MESSAGES, ...messages };
  const [ownTags, setOwnTags] = useState(defaultValue ?? []);
  const tags = value ?? ownTags;
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const removeButtons = useRef<(HTMLButtonElement | null)[]>([]);
  // Where focus goes after a tag is removed from its button: the tag that takes its place, else
  // the previous one, else the input. Applied after the render that drops the tag.
  const focusAfterRemove = useRef<number | null>(null);
  const editable = !state.disabled && !readOnly;

  useEffect(() => {
    if (focusAfterRemove.current === null) return;
    (
      removeButtons.current[focusAfterRemove.current] ?? inputRef.current
    )?.focus();
    focusAfterRemove.current = null;
  }, [tags]);

  // A live region only speaks when its text changes, so an identical message is made different
  // by a trailing space that toggles.
  const announce = (message: string) =>
    setStatus((previous) =>
      previous === message ? `${message}\u00A0` : message,
    );

  const commit = (next: string[]) => {
    setOwnTags(next);
    onValueChange?.(next);
  };

  const addTags = (raw: string[]) => {
    let next = tags;
    const added: string[] = [];
    const rejected: string[] = [];
    let reachedMax = false;

    for (const candidate of raw.map((tag) => tag.trim())) {
      if (candidate === "") continue;
      if (max !== undefined && next.length >= max) {
        reachedMax = true;
      } else if (
        !allowDuplicates &&
        next.some((tag) => tag.toLowerCase() === candidate.toLowerCase())
      ) {
        rejected.push(candidate);
      } else {
        next = [...next, candidate];
        added.push(candidate);
      }
    }

    if (added.length > 0) commit(next);
    const [first] = added;
    announce(
      [
        first === undefined
          ? null
          : added.length === 1
            ? text.added(first, next.length)
            : text.addedMany(added.length, next.length),
        ...rejected.map(text.duplicate),
        reachedMax && max !== undefined ? text.max(max) : null,
      ]
        .filter(Boolean)
        .join(". "),
    );
    return added.length > 0;
  };

  const removeAt = (tag: string, index: number, fromButton: boolean) => {
    const next = tags.filter((_, position) => position !== index);
    commit(next);
    announce(text.removed(tag, next.length));
    if (fromButton) {
      focusAfterRemove.current = index < next.length ? index : next.length - 1;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !editable || event.nativeEvent.isComposing) {
      return;
    }
    // Enter with nothing typed is left alone, so it still submits the form around the field.
    if ((event.key === "Enter" && draft.trim() !== "") || event.key === ",") {
      event.preventDefault();
      if (addTags([draft])) setDraft("");
    } else if (event.key === "Backspace" && draft === "") {
      const last = tags.at(-1);
      if (last !== undefined) {
        event.preventDefault();
        removeAt(last, tags.length - 1, false);
      }
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented || !editable) return;
    const pasted = event.clipboardData.getData("text");
    if (!SEPARATORS.test(pasted)) return;
    event.preventDefault();
    const [first = "", ...rest] = pasted.split(SEPARATORS);
    addTags([draft + first, ...rest]);
    setDraft("");
  };

  /** Focuses the input when the box itself (padding, gaps) is pressed, as a native input would. */
  const focusInput = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      !editable ||
      !(target instanceof Element) ||
      target.closest("input, button")
    ) {
      return;
    }
    event.preventDefault();
    inputRef.current?.focus();
  };

  return (
    <div
      data-slot="tag-input"
      data-invalid={state.invalid || undefined}
      data-disabled={state.disabled || undefined}
      data-readonly={readOnly || undefined}
      className={cn(boxClasses, className)}
      onMouseDown={focusInput}
    >
      {tags.length > 0 && (
        <RovingFocusGroup.Root asChild orientation="horizontal">
          <ul
            role="list"
            aria-label={text.listLabel}
            data-slot="tag-input-list"
            className="m-0 flex flex-wrap gap-2 p-0"
          >
            {tags.map((tag, index) => (
              <li
                key={`${tag}-${index}`}
                data-slot="tag-input-tag"
                className={chipClasses}
              >
                <span className={editable ? undefined : "pr-2"}>{tag}</span>
                {editable && (
                  <RovingFocusGroup.Item asChild>
                    <button
                      type="button"
                      ref={(element) => {
                        removeButtons.current[index] = element;
                      }}
                      aria-label={text.remove(tag)}
                      data-slot="tag-input-remove"
                      className={cn(removeClasses)}
                      onClick={() => removeAt(tag, index, true)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Backspace" ||
                          event.key === "Delete"
                        ) {
                          event.preventDefault();
                          removeAt(tag, index, true);
                        }
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="size-4"
                      >
                        <path
                          d="M4.5 4.5l7 7m0-7l-7 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </RovingFocusGroup.Item>
                )}
              </li>
            ))}
          </ul>
        </RovingFocusGroup.Root>
      )}
      <input
        {...props}
        ref={(element) => {
          inputRef.current = element;
          if (typeof ref === "function") ref(element);
          else if (ref) ref.current = element;
        }}
        type="text"
        id={state.id}
        value={draft}
        disabled={state.disabled}
        readOnly={readOnly}
        aria-describedby={state["aria-describedby"]}
        aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
        aria-required={state["aria-required"] ?? props["aria-required"]}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange?.(event);
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="m-0 min-w-24 flex-1 appearance-none border-0 bg-transparent p-0 text-inherit outline-transparent [font:inherit] placeholder:text-text-placeholder disabled:cursor-not-allowed"
      />
      {name !== undefined &&
        tags.map((tag, index) => (
          <input
            key={`${tag}-${index}`}
            type="hidden"
            name={name}
            value={tag}
            disabled={state.disabled}
          />
        ))}
      <span role="status" data-slot="tag-input-status" className="sr-only">
        {status}
      </span>
    </div>
  );
};
