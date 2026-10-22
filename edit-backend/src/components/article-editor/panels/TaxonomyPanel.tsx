"use client";

import { useMemo, useState } from "react";
import type { EditorOptions } from "@/lib/article-editor/service";
import FieldError from "../FieldError";
import MultiSelect, { type PickerItem } from "../MultiSelect";
import { errorId, type PanelProps } from "./types";

async function searchUsers(q: string): Promise<PickerItem[]> {
  const res = await fetch(
    `/api/backend/users/search?q=${encodeURIComponent(q)}`,
  );
  if (!res.ok) return [];
  return (await res.json()) as PickerItem[];
}

export default function TaxonomyPanel({
  values,
  setField,
  errorFor,
  options,
  initialAuthors = [],
}: PanelProps & {
  options: Pick<EditorOptions, "sections" | "categories">;
  initialAuthors?: PickerItem[];
}) {
  // Sections and categories share one list of ids, split by which picker owns them.
  const sectionIds = useMemo(
    () => new Set(options.sections.map((s) => s.id)),
    [options.sections],
  );
  const categoryItems = useMemo(
    () => options.categories.flatMap((g) => g.items),
    [options.categories],
  );
  const categoryIds = useMemo(
    () => new Set(categoryItems.map((c) => c.id)),
    [categoryItems],
  );

  const pick = (from: PickerItem[]) =>
    from.filter((i) => values.categoryIds.includes(i.id));
  const setOwned = (owned: Set<number>, ids: number[]) =>
    setField("categoryIds", [
      ...values.categoryIds.filter((id) => !owned.has(id)),
      ...ids,
    ]);

  // Authors are searched, so remember every name we've seen.
  const [known, setKnown] = useState<PickerItem[]>(initialAuthors);
  const authors = values.authorIds.map(
    (id) => known.find((k) => k.id === id) ?? { id, name: `User ${id}` },
  );

  return (
    <div className="space-y-4">
      <div>
        <MultiSelect
          label="Sections"
          placeholder="Search sections"
          selected={pick(options.sections)}
          options={[{ items: options.sections }]}
          onChange={(ids) => setOwned(sectionIds, ids)}
          describedBy={errorId("categoryIds")}
          invalid={!!errorFor("categoryIds")}
        />
        <FieldError
          id={errorId("categoryIds")}
          message={errorFor("categoryIds")}
        />
      </div>
      <MultiSelect
        label="Categories"
        placeholder="Search categories"
        selected={pick(categoryItems)}
        options={options.categories}
        onChange={(ids) => setOwned(categoryIds, ids)}
      />
      <div>
        <MultiSelect
          label="Authors"
          placeholder="Search for a user"
          selected={authors}
          search={searchUsers}
          onChange={(ids, items) => {
            setKnown((k) => [...k, ...items]);
            setField("authorIds", ids);
          }}
          describedBy={errorId("authorIds")}
          invalid={!!errorFor("authorIds")}
        />
        <FieldError id={errorId("authorIds")} message={errorFor("authorIds")} />
        <p className="mt-1 text-sm italic">
          For editorials or articles with no author please leave blank
        </p>
      </div>
    </div>
  );
}
