"use client";

import type {
  EditorOptions,
  getArticleForEditor,
} from "@/lib/article-editor/service";
import ArticlePreviewButton from "@/components/ArticlePreviewButton";
import SidebarPanel, { FIELD_TO_PANEL, type PanelId } from "./SidebarPanel";
import FieldError from "./FieldError";
import type { PickerItem } from "./MultiSelect";
import PublishingPanel, {
  useSlugOnHeadlineBlur,
} from "./panels/PublishingPanel";
import TaxonomyPanel from "./panels/TaxonomyPanel";
import ThumbnailPanel from "./panels/ThumbnailPanel";
import EditionPanel from "./panels/EditionPanel";
import StylePanel from "./panels/StylePanel";
import SocialPanel from "./panels/SocialPanel";
import VersionsPanel from "./panels/VersionsPanel";
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
  /** The selected authors' names, since `initial.authorIds` holds only ids. */
  initialAuthors?: PickerItem[];
  /** Preview URL of the stored thumbnail (resolved with `s3URL` by the page). */
  thumbnailUrl?: string;
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

/** `categoryIds.0` belongs to `categoryIds`. */
const fieldOf = (key: string) => key.split(".")[0];

const MAIN_FIELDS = ["headline", "excerpt"];
const isBodyField = (key: string) => key === "body" || key.startsWith("body.");

export default function ArticleEditor({
  mode,
  type,
  initial,
  options,
  article,
  initialAuthors,
  thumbnailUrl,
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
    errorKeys.some((k) => FIELD_TO_PANEL[fieldOf(k)] === id);
  const otherErrors = errorKeys
    .filter(
      (k) =>
        !(fieldOf(k) in FIELD_TO_PANEL) &&
        !MAIN_FIELDS.includes(k) &&
        !isBodyField(k),
    )
    .map((k) => fieldErrors[k] as string);
  const bodyErrors = errorKeys.filter(isBodyField);

  const errorFor = (field: string) => {
    const key = errorKeys.find((k) => fieldOf(k) === field);
    return key === undefined ? undefined : fieldErrors[key];
  };
  const panelProps = { values, setField: form.setField, errorFor };
  const onHeadlineBlur = useSlugOnHeadlineBlur({
    mode,
    values,
    setField: form.setField,
  });

  const panelBody = (id: PanelId) => {
    switch (id) {
      case "publishing":
        return (
          <>
            <PublishingPanel {...panelProps} />
            {form.suggestedSlug && (
              <button
                type="button"
                onClick={form.applySuggestedSlug}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
              >
                Use {form.suggestedSlug}
              </button>
            )}
          </>
        );
      case "taxonomy":
        return (
          <TaxonomyPanel
            {...panelProps}
            options={options}
            initialAuthors={initialAuthors}
          />
        );
      case "thumbnail":
        return (
          <ThumbnailPanel
            {...panelProps}
            articleId={article?.id}
            currentThumbnailId={article?.thumbnailId}
            thumbnailUrl={thumbnailUrl}
          />
        );
      case "edition":
        return <EditionPanel {...panelProps} editions={options.editions} />;
      case "style":
        return <StylePanel {...panelProps} />;
      case "social":
        return (
          <SocialPanel {...panelProps} socialConfig={article?.socialConfig} />
        );
      case "versions":
        return <VersionsPanel drafts={article?.drafts ?? []} />;
    }
  };

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
              onBlur={onHeadlineBlur}
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
              {panelBody(p.id)}
            </SidebarPanel>
          ))}
        </aside>
      </div>

      {form.confirm && <ConfirmDialog confirm={form.confirm} />}
    </div>
  );
}
