import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { ArticleSaveInput, FieldErrors } from "./schema";
import { statusToFlags } from "./status";
import { socialConfigForCreate, socialConfigForEdit } from "./socialConfig";
import { randomSlugSuffix } from "./slug";
import { ukLocalToUtc } from "./ukTime";
import {
  decodeText,
  escapeText,
  renderMarkdown,
  sanitiseBodyHtml,
} from "./content";
import { processArticle } from "./effects/process";
import { purgeCaches } from "./effects/cachePurge";

export type SaveResult =
  | { ok: true; articleId: number; draftId: number; warnings: string[] }
  | {
      ok: false;
      code: "VALIDATION_ERROR" | "NOT_FOUND" | "SLUG_TAKEN";
      message: string;
      fieldErrors?: FieldErrors;
      suggestedSlug?: string;
    };

type Tx = Prisma.TransactionClient;

const DEFAULT_THUMBNAIL = "1";
const IMAGE_NOT_FOUND = "Image not found — try uploading it again";

function validationError(fieldErrors: FieldErrors): SaveResult {
  return {
    ok: false,
    code: "VALIDATION_ERROR",
    message: "Some fields need fixing before this can be saved",
    fieldErrors,
  };
}

function unique(ids: number[]): number[] {
  return [...new Set(ids)];
}

function galleryImages(input: ArticleSaveInput) {
  return input.type === 2 ? input.body.images : [];
}

/** References already on the article; on update these stay valid even if deleted since. */
type LinkedRefs = {
  categoryIds: number[];
  authorIds: number[];
  editionId: number | null;
};

const NO_LINKS: LinkedRefs = {
  categoryIds: [],
  authorIds: [],
  editionId: null,
};

async function checkReferences(
  tx: Tx,
  input: ArticleSaveInput,
  linked: LinkedRefs = NO_LINKS,
): Promise<FieldErrors> {
  const errors: FieldErrors = {};
  const isNew = (have: number[]) => (id: number) => !have.includes(id);

  const categoryIds = unique(input.categoryIds).filter(
    isNew(linked.categoryIds),
  );
  if (categoryIds.length > 0) {
    const found = await tx.categories.count({
      where: { categories_id: { in: categoryIds } },
    });
    if (found !== categoryIds.length) {
      errors.categoryIds =
        "One of the chosen sections or categories no longer exists";
    }
  }

  const authorIds = unique(input.authorIds).filter(isNew(linked.authorIds));
  if (authorIds.length > 0) {
    const found = await tx.users.count({
      where: { users_userid: { in: authorIds }, users_deleted: { not: true } },
    });
    if (found !== authorIds.length) {
      errors.authorIds = "One of the chosen authors no longer exists";
    }
  }

  if (input.editionId !== null && input.editionId !== linked.editionId) {
    const edition = await tx.editions.findFirst({
      where: { editions_id: input.editionId, editions_deleted: false },
      select: { editions_id: true },
    });
    if (!edition) errors.editionId = "That edition no longer exists";
  }

  const images = galleryImages(input);
  // The default thumbnail is always valid, whether or not an s3files row backs it.
  const thumbnailId =
    input.thumbnailId !== null &&
    String(input.thumbnailId) !== DEFAULT_THUMBNAIL
      ? input.thumbnailId
      : null;
  const fileIds = unique([
    ...(thumbnailId !== null ? [thumbnailId] : []),
    ...images.map((i) => i.id),
  ]);
  if (fileIds.length > 0) {
    const rows = await tx.s3files.findMany({
      where: { s3files_id: { in: fileIds } },
      select: { s3files_id: true },
    });
    const existing = new Set(rows.map((r) => r.s3files_id));
    if (thumbnailId !== null && !existing.has(thumbnailId)) {
      errors.thumbnailId = IMAGE_NOT_FOUND;
    }
    images.forEach((img, i) => {
      if (!existing.has(img.id)) {
        errors[`body.images.${i}.caption`] = IMAGE_NOT_FOUND;
      }
    });
  }

  return errors;
}

/** Fields shared by create and update, in the formats PHP wrote. */
function articleFields(input: ArticleSaveInput, published: Date) {
  return {
    articles_published: published,
    articles_updated: new Date(),
    articles_socialExcerpt: escapeText(input.socialExcerpt),
    articles_displayImages: input.displayImages,
    articles_isThumbnailPortrait: input.thumbnailPortrait,
    articles_dropCapital: input.dropCap,
    editions_id: input.editionId,
    articles_editionPage: input.editionPage.trim() || null,
    ...statusToFlags(input.status),
  };
}

function draftBody(
  input: ArticleSaveInput,
  previousText: string | null,
): { articlesDrafts_text: string | null; articlesDrafts_markdown?: string } {
  switch (input.type) {
    case 1:
      return { articlesDrafts_text: sanitiseBodyHtml(input.body.html.trim()) };
    case 6: {
      const markdown = input.body.markdown.trim();
      return {
        articlesDrafts_text: sanitiseBodyHtml(renderMarkdown(markdown)),
        articlesDrafts_markdown: markdown,
      };
    }
    case 2:
      return {
        articlesDrafts_text: input.body.images.map((i) => i.id).join(","),
      };
    case 5:
      return { articlesDrafts_text: input.body.embedUrl };
    case 4:
      // Liveblog bodies are never edited here; carry the last one forward.
      return { articlesDrafts_text: previousText };
  }
}

async function insertDraft(
  tx: Tx,
  articleId: number,
  input: ArticleSaveInput,
  userId: number,
  previousText: string | null,
): Promise<number> {
  const draft = await tx.articlesDrafts.create({
    data: {
      articles_id: articleId,
      articlesDrafts_timestamp: new Date(),
      articlesDrafts_userid: userId,
      articlesDrafts_headline: escapeText(input.headline),
      articlesDrafts_excerpt: escapeText(input.excerpt),
      articlesDrafts_thumbnailCredit: escapeText(input.thumbnailCredit),
      ...draftBody(input, previousText),
    },
    select: { articlesDrafts_id: true },
  });
  return draft.articlesDrafts_id;
}

async function saveGalleryCaptions(tx: Tx, input: ArticleSaveInput) {
  for (const img of galleryImages(input)) {
    await tx.s3files.update({
      where: { s3files_id: img.id },
      data: { s3files_meta_caption: escapeText(img.caption) },
    });
  }
}

/** Makes the article's category and author rows match the input exactly. */
async function syncJoins(tx: Tx, articleId: number, input: ArticleSaveInput) {
  const categoryIds = unique(input.categoryIds);
  const authorIds = unique(input.authorIds);

  await tx.articlesCategories.deleteMany({
    where: { articles_id: articleId, categories_id: { notIn: categoryIds } },
  });
  const haveCategories = await tx.articlesCategories.findMany({
    where: { articles_id: articleId },
    select: { categories_id: true },
  });
  const haveCategoryIds = new Set(haveCategories.map((r) => r.categories_id));
  const newCategoryIds = categoryIds.filter((id) => !haveCategoryIds.has(id));
  if (newCategoryIds.length > 0) {
    await tx.articlesCategories.createMany({
      data: newCategoryIds.map((categories_id) => ({
        articles_id: articleId,
        categories_id,
      })),
    });
  }

  await tx.articlesAuthors.deleteMany({
    where: { articles_id: articleId, users_userid: { notIn: authorIds } },
  });
  const haveAuthors = await tx.articlesAuthors.findMany({
    where: { articles_id: articleId },
    select: { users_userid: true },
  });
  const haveAuthorIds = new Set(haveAuthors.map((r) => r.users_userid));
  const newAuthorIds = authorIds.filter((id) => !haveAuthorIds.has(id));
  if (newAuthorIds.length > 0) {
    await tx.articlesAuthors.createMany({
      data: newAuthorIds.map((users_userid) => ({
        articles_id: articleId,
        users_userid,
      })),
    });
  }
}

async function audit(
  tx: Tx,
  actionType: "CREATE" | "EDIT" | "DELETE",
  articleId: number,
  userId: number,
) {
  await tx.auditLog.create({
    data: {
      auditLog_actionType: actionType,
      auditLog_actionTable: "articles",
      auditLog_actionData: String(articleId),
      users_userid: userId,
    },
  });
}

async function runEffects(
  articleId: number,
  purge: { previousEditionId: number | null; previousCategoryIds: number[] },
): Promise<string[]> {
  try {
    return await processArticle(articleId, { purge });
  } catch (e) {
    console.error("processArticle failed", e);
    return [
      "Saved, but the follow-up jobs (social posts, cache purge) failed to run",
    ];
  }
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const count = await prisma.articles.count({ where: { articles_slug: slug } });
  return count > 0;
}

export async function createArticle(
  input: ArticleSaveInput,
  userId: number,
): Promise<SaveResult> {
  if (input.type === 4) {
    return validationError({
      type: "Liveblog articles can't be created in this editor",
    });
  }
  const slug = input.slug;
  if (!slug) return validationError({ slug: "Slug is required" });
  const published = ukLocalToUtc(input.published);
  if (!published) {
    return validationError({
      published: "Enter a valid publication date and time",
    });
  }

  const result = await prisma.$transaction(async (tx): Promise<SaveResult> => {
    const errors = await checkReferences(tx, input);
    if (Object.keys(errors).length > 0) return validationError(errors);

    const taken = await tx.articles.count({ where: { articles_slug: slug } });
    if (taken > 0) {
      return {
        ok: false,
        code: "SLUG_TAKEN",
        message: "That slug is already taken",
        fieldErrors: { slug: "That slug is already taken" },
        suggestedSlug: `${slug}-${randomSlugSuffix()}`,
      };
    }

    const article = await tx.articles.create({
      data: {
        ...articleFields(input, published),
        articles_slug: slug,
        articles_type: input.type,
        articles_thumbnail: String(input.thumbnailId ?? DEFAULT_THUMBNAIL),
        articles_socialConfig: socialConfigForCreate(input),
      },
      select: { articles_id: true },
    });
    const articleId = article.articles_id;
    const draftId = await insertDraft(tx, articleId, input, userId, null);
    await saveGalleryCaptions(tx, input);
    await syncJoins(tx, articleId, input);
    await audit(tx, "CREATE", articleId, userId);
    return { ok: true, articleId, draftId, warnings: [] };
  });

  if (!result.ok) return result;
  const warnings = await runEffects(result.articleId, {
    previousEditionId: null,
    previousCategoryIds: [],
  });
  return { ...result, warnings };
}

export async function updateArticle(
  articleId: number,
  input: ArticleSaveInput,
  userId: number,
): Promise<SaveResult> {
  const published = ukLocalToUtc(input.published);
  if (!published) {
    return validationError({
      published: "Enter a valid publication date and time",
    });
  }

  let previousEditionId: number | null = null;
  let previousCategoryIds: number[] = [];

  const result = await prisma.$transaction(async (tx): Promise<SaveResult> => {
    // Lock the row so a social claim (effects/process.ts) can't commit
    // between reading socialConfig and writing it back, which would wipe the
    // posted flag and post again. The locking read sees the latest committed
    // value, and it is the value that gets written back.
    const locked = await tx.$queryRaw<{ articles_socialConfig: string }[]>`
      SELECT articles_socialConfig FROM articles
      WHERE articles_id = ${articleId} FOR UPDATE`;
    const existing = await tx.articles.findFirst({
      where: { articles_id: articleId, articles_showInAdmin: true },
      select: {
        articles_type: true,
        articles_socialConfig: true,
        editions_id: true,
        categories: { select: { categories_id: true } },
        users: { select: { users_userid: true } },
      },
    });
    if (!existing) {
      return { ok: false, code: "NOT_FOUND", message: "Article not found" };
    }
    if (existing.articles_type !== input.type) {
      return validationError({ type: "Article type cannot be changed" });
    }

    const errors = await checkReferences(tx, input, {
      categoryIds: existing.categories.map((c) => c.categories_id),
      authorIds: existing.users.map((u) => u.users_userid),
      editionId: existing.editions_id,
    });
    if (Object.keys(errors).length > 0) return validationError(errors);

    previousEditionId = existing.editions_id;
    previousCategoryIds = existing.categories.map((c) => c.categories_id);

    let previousText: string | null = null;
    if (input.type === 4) {
      const last = await tx.articlesDrafts.findFirst({
        where: { articles_id: articleId },
        orderBy: [
          { articlesDrafts_timestamp: "desc" },
          { articlesDrafts_id: "desc" },
        ],
        select: { articlesDrafts_text: true },
      });
      previousText = last?.articlesDrafts_text ?? null;
    }

    // Slug and type are never changed after create.
    await tx.articles.update({
      where: { articles_id: articleId },
      data: {
        ...articleFields(input, published),
        ...(input.thumbnailId !== null
          ? { articles_thumbnail: String(input.thumbnailId) }
          : {}),
        articles_socialConfig: socialConfigForEdit(
          locked[0]?.articles_socialConfig ?? existing.articles_socialConfig,
          input,
        ),
      },
    });
    const draftId = await insertDraft(
      tx,
      articleId,
      input,
      userId,
      previousText,
    );
    await saveGalleryCaptions(tx, input);
    await syncJoins(tx, articleId, input);
    await audit(tx, "EDIT", articleId, userId);
    return { ok: true, articleId, draftId, warnings: [] };
  });

  if (!result.ok) return result;
  const warnings = await runEffects(articleId, {
    previousEditionId,
    previousCategoryIds,
  });
  return { ...result, warnings };
}

function articleUrl(published: Date | null, slug: string | null) {
  const base = process.env.FRONTEND_URL;
  if (!base || !published || !slug) return undefined;
  const y = published.getUTCFullYear();
  const m = String(published.getUTCMonth() + 1).padStart(2, "0");
  const d = String(published.getUTCDate()).padStart(2, "0");
  return `${base}articles/${y}/${m}/${d}/${slug}`;
}

export async function softDeleteArticle(
  articleId: number,
  userId: number,
): Promise<{ ok: boolean }> {
  const article = await prisma.$transaction(async (tx) => {
    const found = await tx.articles.findFirst({
      where: { articles_id: articleId, articles_showInAdmin: true },
      select: {
        articles_published: true,
        articles_slug: true,
        editions_id: true,
        categories: { select: { categories_id: true } },
      },
    });
    if (!found) return null;
    await tx.articles.update({
      where: { articles_id: articleId },
      data: {
        articles_showInAdmin: false,
        articles_showInSearch: false,
        articles_showInLists: false,
      },
    });
    await audit(tx, "DELETE", articleId, userId);
    return found;
  });
  if (!article) return { ok: false };

  await purgeCaches({
    articleUrl: articleUrl(article.articles_published, article.articles_slug),
    slug: article.articles_slug ?? undefined,
    editionIds: article.editions_id !== null ? [article.editions_id] : [],
    categoryIds: article.categories.map((c) => c.categories_id),
  });
  return { ok: true };
}

function userName(u: {
  users_name1: string | null;
  users_name2: string | null;
}) {
  return `${decodeText(u.users_name1)} ${decodeText(u.users_name2)}`.trim();
}

const nameSelect = {
  users_userid: true,
  users_name1: true,
  users_name2: true,
} as const;

export async function getArticleForEditor(articleId: number) {
  const found = await prisma.articles.findFirst({
    where: { articles_id: articleId, articles_showInAdmin: true },
    include: {
      categories: { select: { categories_id: true } },
      users: { include: { users: { select: nameSelect } } },
    },
  });
  if (!found) return null;
  const { categories, users, ...article } = found;

  const latestFirst = [
    { articlesDrafts_timestamp: "desc" as const },
    { articlesDrafts_id: "desc" as const },
  ];
  const [draft, drafts] = await Promise.all([
    prisma.articlesDrafts.findFirst({
      where: { articles_id: articleId },
      orderBy: latestFirst,
    }),
    prisma.articlesDrafts.findMany({
      where: { articles_id: articleId },
      orderBy: latestFirst,
      select: {
        articlesDrafts_id: true,
        articlesDrafts_timestamp: true,
        articlesDrafts_headline: true,
        articlesDrafts_changelog: true,
        articlesDrafts_userid: true,
        users: { select: nameSelect },
      },
    }),
  ]);

  return {
    article,
    draft,
    categoryIds: categories.map((c) => c.categories_id),
    authors: users.map((a) => ({
      id: a.users.users_userid,
      name: userName(a.users),
    })),
    drafts: drafts.map(({ users: u, ...d }) => ({
      ...d,
      userName: u ? userName(u) : null,
    })),
  };
}

/** Mirrors the option queries in html/admin/article.php. */
export async function getEditorOptions() {
  const [categories, editions] = await Promise.all([
    prisma.categories.findMany({
      where: { categories_showPublic: true },
      orderBy: [{ categories_order: "asc" }, { categories_displayName: "asc" }],
      select: {
        categories_id: true,
        categories_name: true,
        categories_displayName: true,
        categories_nestUnder: true,
      },
    }),
    prisma.editions.findMany({
      where: { editions_deleted: false },
      orderBy: { editions_published: "desc" },
      select: {
        editions_id: true,
        editions_name: true,
        editions_printNumber: true,
      },
    }),
  ]);

  const item = (c: (typeof categories)[number]) => ({
    id: c.categories_id,
    name: c.categories_displayName ?? c.categories_name,
  });
  const childrenOf = (id: number) =>
    categories.filter((c) => c.categories_nestUnder === id);

  const tops = categories.filter((c) => c.categories_nestUnder === null);
  const groups = tops.map((top) => ({
    groupName: item(top).name,
    // Only two levels of nesting, flattened: child, then its children.
    items: childrenOf(top.categories_id).flatMap((child) => [
      item(child),
      ...childrenOf(child.categories_id).map(item),
    ]),
  }));

  return {
    sections: tops.map(item),
    categories: groups.filter((g) => g.items.length > 0),
    editions: editions.map((e) => ({
      id: e.editions_id,
      label:
        e.editions_name +
        (e.editions_printNumber !== null
          ? ` (Number ${e.editions_printNumber})`
          : ""),
    })),
  };
}

export type EditorOptions = Awaited<ReturnType<typeof getEditorOptions>>;
