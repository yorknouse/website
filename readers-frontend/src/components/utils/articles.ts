import { Prisma } from "@prisma/client";
import prisma from "../../prisma";
import { s3URL } from "./s3URL";

const articlesWithArticleDrafts = Prisma.validator<Prisma.articlesArgs>()({
  include: {
    articlesDrafts: {
      include: { users: true },
    },
  },
});
export type articlesWithArticleDrafts = Prisma.articlesGetPayload<
  typeof articlesWithArticleDrafts
>;

/**
 * Retrieves an article with its latest draft and the user who wrote it.
 * @param {number[]} articleIds The article IDs to retrieve.
 * @returns {Promise<articlesWithArticleDrafts[]>} Promise object represents the articles.
 */
export const getArticles = async (
  articleIds?: number[]
): Promise<articlesWithArticleDrafts[]> => {
  if (articleIds == undefined) {
    return [];
  }

  return await prisma.articles.findMany({
    where: {
      articles_id: {
        in: articleIds,
      },
      articles_showInLists: true,
    },
    include: {
      articlesDrafts: {
        // Get the latest draft for every featured article
        orderBy: {
          articlesDrafts_timestamp: "desc",
        },
        take: 1,
        include: {
          // Get the user who wrote the article
          users: true,
        },
      },
    },
  });
};

/**
 * Retrieves an article image.
 * @param {articlesWithArticleDrafts} article The article.
 * @param {"tiny" | "small" | "medium" | "large" | false} [size] File size.
 * @returns {Promise<string>} Promise object represents the article image url.
 * TODO: Update the image for articles with articles_displayImages as false. We're currently using the archive one.
 */
export const getArticleImage = async (
  article: articlesWithArticleDrafts,
  size: "tiny" | "small" | "medium" | "large" | false = "large"
): Promise<string> => {
  if (!article.articles_displayImages) {
    return (
      import.meta.env.fileStoreUrl + "/nouseSiteAssets/imageArchive-comp.jpg"
    );
  } else if (Number(article.articles_thumbnail)) {
    return await s3URL(Number(article.articles_thumbnail), size);
  } else
    return import.meta.env.archiveFileStoreUrl + article.articles_thumbnail;
};
