import { z } from "zod";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import { s3URL } from "@/lib/s3URL";
import ArticleEditor from "@/components/article-editor/ArticleEditor";
import {
  getArticleForEditor,
  getEditorOptions,
} from "@/lib/article-editor/service";
import {
  editInitialValues,
  galleryIds,
  isArticleType,
} from "@/lib/article-editor/initialValues";
import { articleSiteUrl, articleStatsUrl } from "@/lib/article-editor/links";

export const metadata: Metadata = {
  title: "Article",
};

const DEFAULT_THUMBNAIL = 1;

/** A missing or broken image shouldn't stop the article loading. */
async function safeS3URL(id: number): Promise<string | undefined> {
  try {
    return await s3URL(id, "small");
  } catch {
    return undefined;
  }
}

export default async function Article({
  params,
}: {
  params: Promise<{
    articleId: string;
  }>;
}) {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(32, userData.actions)) {
    return <p>Unauthorised</p>;
  }

  const resolvedParams = await params;
  const articleIDParse = z
    .preprocess((val) => (val ? val : undefined), z.coerce.number())
    .safeParse(resolvedParams.articleId);

  if (!articleIDParse.success) {
    return <>Invalid Article ID</>;
  }

  const [found, options] = await Promise.all([
    getArticleForEditor(articleIDParse.data),
    getEditorOptions(),
  ]);

  if (!found) {
    return <>Article not found</>;
  }

  const { article, draft } = found;
  const type = article.articles_type;
  if (!isArticleType(type)) {
    return <>Unsupported article type</>;
  }

  const imageIds =
    type === 2 ? galleryIds(draft?.articlesDrafts_text ?? null) : [];
  const storedThumbnail = Number(article.articles_thumbnail);
  // Anything that isn't an s3files id is treated as the default thumbnail.
  const thumbnailId =
    Number.isInteger(storedThumbnail) && storedThumbnail > 0
      ? storedThumbnail
      : DEFAULT_THUMBNAIL;

  const [captionRows, thumbnailUrl, galleryUrls] = await Promise.all([
    imageIds.length > 0
      ? prisma.s3files.findMany({
          where: { s3files_id: { in: imageIds } },
          select: { s3files_id: true, s3files_meta_caption: true },
        })
      : [],
    safeS3URL(thumbnailId),
    Promise.all(imageIds.map(safeS3URL)),
  ]);

  const captions = new Map(
    captionRows.map((r) => [r.s3files_id, r.s3files_meta_caption ?? ""]),
  );
  const galleryImageUrls: Record<number, string> = {};
  imageIds.forEach((id, i) => {
    const url = galleryUrls[i];
    if (url) galleryImageUrls[id] = url;
  });

  const initial = editInitialValues(found, {
    archiveUrl: process.env.ARCHIVEFILESTOREURL ?? "",
    captions,
  });

  const published = article.articles_published;

  return (
    <ArticleEditor
      // A fresh form per article, so client-side navigation doesn't carry state over.
      key={article.articles_id}
      mode="edit"
      type={type}
      initial={initial}
      options={options}
      article={{
        id: article.articles_id,
        slug: article.articles_slug ?? "",
        publishedUtc: published?.toISOString() ?? "",
        showInSearch: article.articles_showInSearch,
        showInAdmin: article.articles_showInAdmin,
        socialConfig: article.articles_socialConfig,
        thumbnailId,
        drafts: found.drafts,
      }}
      initialAuthors={found.authors}
      thumbnailUrl={thumbnailUrl}
      galleryImageUrls={galleryImageUrls}
      links={
        published
          ? {
              site: articleSiteUrl(published, article.articles_slug),
              stats: articleStatsUrl(article.articles_id, published),
            }
          : undefined
      }
      can={{ delete: checkUserPermissions(33, userData.actions) }}
    />
  );
}
