"use client";

import { useRef } from "react";
import type { ArticleStatus } from "@/lib/article-editor/status";
import FieldError from "../FieldError";
import type { ArticleFormValues } from "../useArticleForm";
import { errorId, type PanelProps } from "./types";

const STATUSES: { value: ArticleStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "search", label: "Display in search only" },
  { value: "published", label: "Published" },
];

/**
 * Returns the headline's onBlur handler: on create, while no slug exists yet,
 * it asks the server for one.
 */
export function useSlugOnHeadlineBlur({
  mode,
  values,
  setField,
}: {
  mode: "create" | "edit";
  values: ArticleFormValues;
  setField: PanelProps["setField"];
}) {
  const latest = useRef(values);
  latest.current = values;
  const inFlight = useRef(false);

  return () => {
    const headline = values.headline.trim();
    if (mode !== "create" || values.slug || !headline || inFlight.current) {
      return;
    }
    inFlight.current = true;
    fetch(`/api/backend/articles/slug?headline=${encodeURIComponent(headline)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { slug?: string } | null) => {
        // Don't overwrite a slug that arrived (e.g. applied suggestion) meanwhile.
        if (body?.slug && !latest.current.slug) setField("slug", body.slug);
      })
      .catch(() => {
        // Saving reports a missing slug; the next blur retries.
      })
      .finally(() => {
        inFlight.current = false;
      });
  };
}

export default function PublishingPanel({
  values,
  setField,
  errorFor,
}: PanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="published" className="block font-semibold">
          Publication date (UK time)
        </label>
        <input
          id="published"
          type="datetime-local"
          step="1"
          value={values.published}
          onChange={(e) => setField("published", e.target.value)}
          aria-invalid={!!errorFor("published")}
          aria-describedby={errorId("published")}
          className="mt-1 w-full rounded-md border border-gray-300 p-2"
        />
        <FieldError id={errorId("published")} message={errorFor("published")} />
        <p className="mt-1 text-sm italic">
          Articles with a status of &quot;published&quot; and a date in the
          future will be published upto two hours after the date and time
          selected due to cache constraints
        </p>
      </div>
      <div>
        <label htmlFor="status" className="block font-semibold">
          Status
        </label>
        <select
          id="status"
          value={values.status}
          onChange={(e) => setField("status", e.target.value as ArticleStatus)}
          aria-invalid={!!errorFor("status")}
          aria-describedby={errorId("status")}
          className="mt-1 w-full rounded-md border border-gray-300 p-2"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <FieldError id={errorId("status")} message={errorFor("status")} />
      </div>
      <div>
        <label htmlFor="slug" className="block font-semibold">
          Slug
        </label>
        <input
          id="slug"
          readOnly
          value={values.slug ?? ""}
          aria-invalid={!!errorFor("slug")}
          aria-describedby={errorId("slug")}
          className="mt-1 w-full rounded-md border border-gray-300 bg-gray-100 p-2"
        />
        <FieldError id={errorId("slug")} message={errorFor("slug")} />
        <p className="mt-1 text-sm italic">
          Contact support@nouse.co.uk for a custom URL
        </p>
      </div>
    </div>
  );
}
