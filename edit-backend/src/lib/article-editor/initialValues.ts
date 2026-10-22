import type {
  ArticleFormValues,
  ArticleType,
} from "@/components/article-editor/useArticleForm";
import type { getArticleForEditor } from "./service";
import { decodeText, legacyHtmlForEditor } from "./content";
import { htmlToMarkdown } from "@/lib/htmlToMarkdown";
import { flagsToStatus } from "./status";
import { parseSocialConfig } from "./socialConfig";
import { utcToUkLocal } from "./ukTime";

export type EditorArticle = NonNullable<
  Awaited<ReturnType<typeof getArticleForEditor>>
>;
export type CreatableType = Exclude<ArticleType, 4>;

const ARTICLE_TYPES: readonly number[] = [1, 2, 4, 5, 6];
const CREATABLE_TYPES: readonly number[] = [1, 2, 5, 6];

export function isArticleType(n: number): n is ArticleType {
  return ARTICLE_TYPES.includes(n);
}

export function isCreatableType(n: number): n is CreatableType {
  return CREATABLE_TYPES.includes(n);
}

/** A gallery body's comma-separated s3files ids. */
export function galleryIds(text: string | null): number[] {
  return (text ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function emptyBody(type: CreatableType) {
  switch (type) {
    case 1:
      return { html: "" };
    case 6:
      return { markdown: "" };
    case 2:
      return { images: [] };
    case 5:
      return { embedUrl: "" };
  }
}

export function createDefaults(
  type: CreatableType,
  now: Date = new Date(),
): ArticleFormValues {
  return {
    headline: "",
    excerpt: "",
    published: utcToUkLocal(now),
    status: "draft",
    editionId: null,
    editionPage: "",
    categoryIds: [],
    authorIds: [],
    dropCap: false,
    displayImages: true,
    thumbnailPortrait: false,
    postToFacebook: true,
    postToTwitter: true,
    socialExcerpt: "",
    thumbnailId: 1,
    thumbnailCredit: "",
    body: emptyBody(type),
  } as ArticleFormValues;
}

function editBody(
  type: ArticleType,
  draft: EditorArticle["draft"],
  opts: { archiveUrl: string; captions: Map<number, string> },
) {
  const text = draft?.articlesDrafts_text ?? null;
  switch (type) {
    case 1:
      return { html: legacyHtmlForEditor(text, opts.archiveUrl) };
    case 6:
      // Rows without markdown (legacy or PHP-saved) seed it from the stored HTML,
      // so a save doesn't replace the body with nothing.
      return {
        markdown:
          draft?.articlesDrafts_markdown ||
          htmlToMarkdown(legacyHtmlForEditor(text, opts.archiveUrl))
            // The newline -> <br/> substitution leaves empty hard breaks between blocks.
            .replace(/^[ \t]+$/gm, "")
            .replace(/\n{3,}/g, "\n\n"),
      };
    case 2:
      return {
        images: galleryIds(text).map((id) => ({
          id,
          caption: decodeText(opts.captions.get(id) ?? null),
        })),
      };
    case 5:
      return { embedUrl: text ?? "" };
    case 4:
      // Liveblog bodies are never edited here.
      return undefined;
  }
}

/**
 * The editor's starting values for a stored article. `captions` holds each
 * gallery image's stored (encoded) `s3files_meta_caption`.
 */
export function editInitialValues(
  { article, draft, categoryIds, authors }: EditorArticle,
  opts: { archiveUrl: string; captions: Map<number, string> },
): ArticleFormValues {
  const type = article.articles_type;
  if (!isArticleType(type)) {
    throw new Error(`Unsupported article type ${type}`);
  }
  const social = parseSocialConfig(article.articles_socialConfig);
  const body = editBody(type, draft, opts);
  return {
    headline: decodeText(draft?.articlesDrafts_headline ?? null),
    excerpt: decodeText(draft?.articlesDrafts_excerpt ?? null),
    published: article.articles_published
      ? utcToUkLocal(article.articles_published)
      : "",
    status: flagsToStatus(article),
    editionId: article.editions_id,
    editionPage: article.articles_editionPage ?? "",
    categoryIds,
    authorIds: authors.map((a) => a.id),
    dropCap: article.articles_dropCapital,
    displayImages: article.articles_displayImages ?? true,
    thumbnailPortrait: article.articles_isThumbnailPortrait,
    postToFacebook: social?.fbWanted ?? false,
    postToTwitter: social?.twWanted ?? false,
    socialExcerpt: decodeText(article.articles_socialExcerpt),
    // null = keep the stored thumbnail
    thumbnailId: null,
    thumbnailCredit: decodeText(draft?.articlesDrafts_thumbnailCredit ?? null),
    slug: article.articles_slug ?? undefined,
    ...(body ? { body } : {}),
  } as ArticleFormValues;
}
