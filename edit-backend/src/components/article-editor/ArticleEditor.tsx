"use client";

import type { ReactNode } from "react";
import type {
  EditorOptions,
  getArticleForEditor,
} from "@/lib/article-editor/service";
import ArticlePreviewButton from "@/components/ArticlePreviewButton";
import SidebarPanel, { FIELD_TO_PANEL, type PanelId } from "./SidebarPanel";
import FieldError from "./FieldError";
import SaveStatus from "./SaveStatus";
import ConfirmDialog from "./ConfirmDialog";
import {
  useArticleForm,
  type ArticleFormValues,
  type ArticleType,
} from "./useArticleForm";

export type { ArticleFormValues } from "./useArticleForm";

export type DraftSummary = NonNullable<
  Awaited<ReturnType<typeof getArticleForEditor>>
>["drafts"][number];

export interface ArticleEditorProps {
  mode: "create" | "edit";
  type: ArticleType;
  initial: ArticleFormValues;
  options: EditorOptions;
  article?: {
    id: number;
    slug: string;
    publishedUtc: string;
    showInSearch: boolean;
    showInAdmin: boolean;
    socialConfig: string;
    /** The stored thumbnail id, for the save confirmations. */
    thumbnailId: number;
    drafts: DraftSummary[];
  };
  can: { delete: boolean };
}

const PANELS: { id: PanelId; title: string; defaultOpen?: boolean }[] = [
  { id: "publishing", title: "Publishing", defaultOpen: true },
  { id: "taxonomy", title: "Sections & authors", defaultOpen: true },
  { id: "thumbnail", title: "Thumbnail", defaultOpen: true },
  { id: "edition", title: "Edition" },
  { id: "style", title: "Style & images" },
  { id: "social", title: "Social media" },
  { id: "versions", title: "Saved versions" },
];

const MAIN_FIELDS = ["headline", "excerpt"];
const isBodyField = (key: string) => key === "body" || key.startsWith("body.");

export default function ArticleEditor({
  mode,
  type,
  initial,
  article,
}: ArticleEditorProps) {
  const form = useArticleForm({
    mode,
    type,
    initial,
    articleId: article?.id,
    currentThumbnailId: article?.thumbnailId,
  });
  const { values, fieldErrors } = form;

  const errorKeys = Object.keys(fieldErrors).filter((k) => fieldErrors[k]);
  const panelHasError = (id: PanelId) =>
    errorKeys.some((k) => FIELD_TO_PANEL[k] === id);
  const otherErrors = errorKeys
    .filter(
      (k) =>
        !(k in FIELD_TO_PANEL) && !MAIN_FIELDS.includes(k) && !isBodyField(k),
    )
    .map((k) => fieldErrors[k] as string);
  const bodyErrors = errorKeys.filter(isBodyField);

  const panelErrors = (id: PanelId): ReactNode =>
    Object.keys(FIELD_TO_PANEL)
      .filter((field) => FIELD_TO_PANEL[field] === id)
      .map((field) => (
        <FieldError
          key={field}
          id={`${field}-error`}
          message={fieldErrors[field]}
        />
      ));

  return (
    <div className="space-y-4">
      <SaveStatus
        error={form.error}
        fieldErrorCount={errorKeys.length}
        otherErrors={otherErrors}
        warnings={form.warnings}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label htmlFor="headline" className="sr-only">
              Headline
            </label>
            <textarea
              id="headline"
              rows={2}
              value={values.headline}
              onChange={(e) => form.setField("headline", e.target.value)}
              placeholder="University of York to open campus on the Moon"
              aria-invalid={!!fieldErrors.headline}
              aria-describedby="headline-error"
              className="w-full resize-none rounded-md border border-gray-300 p-3 text-3xl font-bold"
            />
            <FieldError id="headline-error" message={fieldErrors.headline} />
          </div>
          <div>
            <label htmlFor="excerpt" className="sr-only">
              Strapline
            </label>
            <textarea
              id="excerpt"
              rows={3}
              value={values.excerpt}
              onChange={(e) => form.setField("excerpt", e.target.value)}
              placeholder="Use of straplines is advisable for display purposes"
              aria-invalid={!!fieldErrors.excerpt}
              aria-describedby="excerpt-error"
              className="w-full resize-none rounded-md border border-gray-300 p-3 text-lg"
            />
            <FieldError id="excerpt-error" message={fieldErrors.excerpt} />
          </div>
          <div>
            {/* Body editors per type arrive in Task 12. */}
            <div className="rounded-md border border-dashed border-gray-300 p-6 text-gray-500">
              Article body
            </div>
            {bodyErrors.map((k) => (
              <FieldError key={k} message={fieldErrors[k]} />
            ))}
          </div>
        </div>

        <aside className="w-full space-y-4 lg:w-80">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void form.save()}
              disabled={form.saving || form.confirm !== null}
              className="cursor-pointer rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {form.saving ? "Saving…" : "Save"}
            </button>
            {article && (
              <ArticlePreviewButton props={{ articleID: article.id }} />
            )}
          </div>
          {form.savedAt && (
            <p role="status" className="text-sm text-green-700">
              Saved at {form.savedAt}
            </p>
          )}

          {PANELS.map((p) => (
            <SidebarPanel
              key={p.id}
              id={p.id}
              title={p.title}
              defaultOpen={p.defaultOpen}
              forceOpen={panelHasError(p.id)}
            >
              {panelErrors(p.id)}
              {p.id === "publishing" && form.suggestedSlug && (
                <button
                  type="button"
                  onClick={form.applySuggestedSlug}
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
                >
                  Use {form.suggestedSlug}
                </button>
              )}
            </SidebarPanel>
          ))}
        </aside>
      </div>

      {form.confirm && <ConfirmDialog confirm={form.confirm} />}
    </div>
  );
}
