"use client";

import type {
  EditorOptions,
  getArticleForEditor,
} from "@/lib/article-editor/service";
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
import RichTextBody from "./bodies/RichTextBody";
import GalleryBody, { type GalleryImage } from "./bodies/GalleryBody";
import PrintEditionBody from "./bodies/PrintEditionBody";
import LegacyLiveblogNotice from "./bodies/LegacyLiveblogNotice";
import SaveStatus from "./SaveStatus";
import ConfirmDialog from "./ConfirmDialog";
import HeaderActions from "./HeaderActions";
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
  /** Display URLs of existing gallery images, keyed by s3files id (`s3URL(id, "small")`). */
  galleryImageUrls?: Record<number, string>;
  /** "View on site" and "Stats" URLs, built server-side from env vars. */
  links?: { site: string; stats: string };
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
/** Whether the active type's body control renders this error itself. */
const isRenderedBodyField = (type: ArticleType, key: string) => {
  switch (type) {
    case 1:
      return key === "body.html";
    case 6:
      return key === "body.markdown";
    case 2:
      return /^body\.images\.\d+\.caption$/.test(key);
    case 5:
      return key === "body.embedUrl";
    case 4:
      return false;
  }
};

export default function ArticleEditor({
  mode,
  type,
  initial,
  options,
  article,
  initialAuthors,
  thumbnailUrl,
  galleryImageUrls,
  links,
  can,
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
        !isRenderedBodyField(type, k),
    )
    .map((k) => fieldErrors[k] as string);

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

  const renderBody = () => {
    // The body shape follows `type`; `initial.body` is only read once, to seed the editor.
    const initialBody = (initial as { body?: Record<string, unknown> }).body;
    const currentBody = (values as { body?: Record<string, unknown> }).body;
    switch (type) {
      case 1:
      case 6:
        return (
          <RichTextBody
            type={type}
            initialHtml={initialBody?.html as string | undefined}
            initialMarkdown={initialBody?.markdown as string | undefined}
            articleId={article?.id}
            onChange={form.setBody}
            error={fieldErrors[type === 1 ? "body.html" : "body.markdown"]}
          />
        );
      case 2:
        return (
          <GalleryBody
            images={(currentBody?.images as GalleryImage[] | undefined) ?? []}
            imageUrls={galleryImageUrls}
            onChange={(images) => form.setBody({ images })}
            fieldErrors={fieldErrors}
          />
        );
      case 5:
        return (
          <PrintEditionBody
            embedUrl={(currentBody?.embedUrl as string | undefined) ?? ""}
            onChange={(embedUrl) => form.setBody({ embedUrl })}
            error={fieldErrors["body.embedUrl"]}
          />
        );
      case 4:
        return <LegacyLiveblogNotice />;
    }
  };

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
          <div>{renderBody()}</div>
        </div>

        <aside className="w-full space-y-4 lg:w-80">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void form.save()}
              disabled={form.saving || form.confirm !== null}
              className="cursor-pointer rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {form.saving ? "Saving…" : "Save"}
            </button>
            {article && (
              <HeaderActions
                articleId={article.id}
                headline={initial.headline}
                showInSearch={article.showInSearch}
                showInAdmin={article.showInAdmin}
                publishedUtc={article.publishedUtc}
                links={links}
                canDelete={can.delete}
                onDeleted={form.markClean}
              />
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
