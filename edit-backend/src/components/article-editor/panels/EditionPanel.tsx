"use client";

import type { EditorOptions } from "@/lib/article-editor/service";
import FieldError from "../FieldError";
import { errorId, type PanelProps } from "./types";

export default function EditionPanel({
  values,
  setField,
  errorFor,
  editions,
}: PanelProps & { editions: EditorOptions["editions"] }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="editionId" className="block font-semibold">
          Edition
        </label>
        <select
          id="editionId"
          value={values.editionId ?? ""}
          onChange={(e) =>
            setField(
              "editionId",
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
          aria-invalid={!!errorFor("editionId")}
          aria-describedby={errorId("editionId")}
          className="mt-1 w-full rounded-md border border-gray-300 p-2"
        >
          <option value=""></option>
          {editions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <FieldError id={errorId("editionId")} message={errorFor("editionId")} />
      </div>
      <div>
        <label htmlFor="editionPage" className="block font-semibold">
          Print Edition Page Number
        </label>
        <input
          type="text"
          id="editionPage"
          value={values.editionPage}
          onChange={(e) => setField("editionPage", e.target.value)}
          aria-invalid={!!errorFor("editionPage")}
          aria-describedby={errorId("editionPage")}
          className="mt-1 w-full rounded-md border border-gray-300 p-2"
        />
        <FieldError
          id={errorId("editionPage")}
          message={errorFor("editionPage")}
        />
      </div>
    </div>
  );
}
