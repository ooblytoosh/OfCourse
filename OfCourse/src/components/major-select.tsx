"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";

import { MAJORS } from "@/lib/majors";
import { cn } from "@/lib/utils";

// Searchable major picker. Typing filters the list, but only a major picked
// from the list is ever submitted (as a hidden input); anything else is
// discarded when the field loses focus.
export function MajorSelect({
  id,
  name = "major",
  defaultValue = "",
  invalid,
  placeholder = "Search majors…",
}: {
  id: string;
  name?: string;
  defaultValue?: string;
  invalid?: boolean;
  placeholder?: string;
}) {
  const initial = (MAJORS as readonly string[]).includes(defaultValue) ? defaultValue : "";
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!open || query === selected) return [...MAJORS];
    return MAJORS.filter((m) => words.every((w) => m.toLowerCase().includes(w)));
  }, [query, open, selected]);

  const choose = (major: string) => {
    setSelected(major);
    setQuery(major);
    setOpen(false);
  };
  const revert = () => {
    const exact = MAJORS.find((m) => m.toLowerCase() === query.trim().toLowerCase());
    if (exact) choose(exact);
    else {
      setQuery(selected);
      setOpen(false);
    }
  };
  const move = (delta: number) => {
    setOpen(true);
    setActive((i) => {
      const next = (i + delta + matches.length) % Math.max(matches.length, 1);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
      return next;
    });
  };

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected} />
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={(e) => {
          e.target.select();
          setOpen(true);
        }}
        onBlur={revert}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            if (matches[active]) choose(matches[active]);
          } else if (e.key === "Escape") {
            setQuery(selected);
            setOpen(false);
          }
        }}
        className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent pr-14 pl-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
      />
      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground">
        <ChevronsUpDown className="size-4" aria-hidden />
      </span>
      {selected && (
        <button
          type="button"
          aria-label="Clear major"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setSelected("");
            setQuery("");
          }}
          className="absolute top-1/2 right-8 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label="Majors"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-sm shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          {matches.length === 0 ? (
            <li className="px-2.5 py-2 text-muted-foreground">No majors match “{query}”.</li>
          ) : (
            matches.map((m, i) => (
              <li
                key={m}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={m === selected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(m)}
                onMouseMove={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5",
                  i === active && "bg-accent text-accent-foreground",
                )}
              >
                {m}
                {m === selected && <Check className="size-4 shrink-0" aria-hidden />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
