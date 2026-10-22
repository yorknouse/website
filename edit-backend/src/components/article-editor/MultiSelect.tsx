"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface PickerItem {
  id: number;
  name: string;
}

export interface PickerGroup {
  groupName?: string;
  items: PickerItem[];
}

export interface MultiSelectProps {
  label: string;
  selected: PickerItem[];
  onChange: (ids: number[], items: PickerItem[]) => void;
  /** Filtered locally as the user types. */
  options?: PickerGroup[];
  /** Called (debounced) with the typed text instead of filtering `options`. */
  search?: (q: string) => Promise<PickerItem[]>;
  placeholder?: string;
  /** Id of an element describing this control, e.g. its error message. */
  describedBy?: string;
  invalid?: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

export default function MultiSelect({
  label,
  selected,
  onChange,
  options,
  search,
  placeholder,
  describedBy,
  invalid,
}: MultiSelectProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [found, setFound] = useState<PickerItem[]>([]);
  const searchRef = useRef(search);
  searchRef.current = search;
  const searching = search !== undefined;

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected],
  );

  useEffect(() => {
    const run = searchRef.current;
    const q = query.trim();
    if (!run) return;
    if (!q) {
      setFound([]);
      return;
    }
    let stale = false;
    const timer = setTimeout(() => {
      run(q)
        .then((items) => {
          if (!stale) setFound(items);
        })
        .catch(() => {
          if (!stale) setFound([]);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  const groups: PickerGroup[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source: PickerGroup[] = searching
      ? [{ items: found }]
      : (options ?? []).map((g) => ({
          ...g,
          items: g.items.filter((i) => i.name.toLowerCase().includes(q)),
        }));
    return source
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => !selectedIds.has(i.id)),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, searching, found, options, selectedIds]);

  const flat = groups.flatMap((g) => g.items);
  const showList = open && (!searching || query.trim() !== "");
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));

  const commit = (next: PickerItem[]) =>
    onChange(
      next.map((i) => i.id),
      next,
    );

  const add = (item: PickerItem) => {
    commit([...selected, item]);
    setQuery("");
    setActive(0);
  };

  const remove = (id: number) => commit(selected.filter((i) => i.id !== id));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive(Math.min(activeIndex + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      // Never submit or save from here.
      e.preventDefault();
      if (showList && flat[activeIndex]) add(flat[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
      remove(selected[selected.length - 1].id);
    }
  };

  let optionIndex = -1;
  return (
    <div className="relative">
      <label htmlFor={`${baseId}-input`} className="block font-semibold">
        {label}
      </label>
      <div
        className={`mt-1 flex flex-wrap gap-1 rounded-md border bg-white p-1 ${
          invalid ? "border-red-500" : "border-gray-300"
        }`}
      >
        {selected.map((item) => (
          <span
            key={item.id}
            className="flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-sm"
          >
            {item.name}
            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              onClick={() => remove(item.id)}
              className="cursor-pointer text-gray-600 hover:text-black"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={`${baseId}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && flat.length > 0
              ? `${baseId}-opt-${flat[activeIndex].id}`
              : undefined
          }
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          value={query}
          placeholder={selected.length === 0 ? placeholder : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="min-w-24 flex-1 p-1 outline-none"
        />
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow"
        >
          {flat.length === 0 && (
            <li className="p-2 text-sm text-gray-500">No matches</li>
          )}
          {groups.map((g, gi) => (
            <li key={g.groupName ?? gi} role="presentation">
              {g.groupName && (
                <div className="bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                  {g.groupName}
                </div>
              )}
              <ul role="group" aria-label={g.groupName}>
                {g.items.map((item) => {
                  optionIndex += 1;
                  const isActive = optionIndex === activeIndex;
                  return (
                    <li
                      key={item.id}
                      id={`${baseId}-opt-${item.id}`}
                      role="option"
                      aria-selected={isActive}
                      // mousedown, so it lands before the input's blur closes the list
                      onMouseDown={(e) => {
                        e.preventDefault();
                        add(item);
                      }}
                      className={`cursor-pointer px-2 py-1 ${
                        isActive ? "bg-blue-100" : ""
                      }`}
                    >
                      {item.name}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
