import { articles, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { s3URL } from "@/lib/s3URL";
import { TopArticleResult } from "@/lib/types";

const articlesWithArticleDrafts = Prisma.validator()({
  include: {
    articlesDrafts: true,
    categories: {
      include: { category: true },
    },
    users: {
      include: { users: true },
    },
  },
});
export type articlesWithArticleDrafts = Prisma.articlesGetPayload<
  typeof articlesWithArticleDrafts
>;

/**
 * Gets 4 article with same parent category as the passed one.
 * @param {number} parentCategoryId The parent category id.
 * @param {number} currentArticleId The current article id as to not fetch it.
 * @returns {Promise<articlesWithArticleDrafts[]>} Promise object represents the articles.
 */
export const getSimilarArticles = async (
  parentCategoryId: number,
  currentArticleId: number,
): Promise<articlesWithArticleDrafts[]> => {
  return prisma.articles.findMany({
    where: {
      categories: {
        some: {
          categories_id: {
            equals: parentCategoryId,
          },
        },
      },
      articles_showInLists: true,
      NOT: {
        articles_id: currentArticleId,
      },
    },
    orderBy: {
      articles_published: "desc",
    },
    take: 4,
    include: {
      articlesDrafts: {
        // Get the latest draft for every featured article
        orderBy: {
          articlesDrafts_timestamp: "desc",
        },
        take: 1,
      },
      categories: {
        include: {
          category: true,
        },
      },
      users: {
        include: { users: true },
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
  article: articles | TopArticleResult,
  size: "tiny" | "small" | "medium" | "large" | false = "large",
): Promise<string> => {
  if (!article.articles_displayImages) {
    return process.env.FILESTOREURL + "/nouseSiteAssets/imageArchive-comp.jpg";
  } else if (Number(article.articles_thumbnail)) {
    return await s3URL(Number(article.articles_thumbnail), size);
  } else
    return String(process.env.ARCHIVEFILESTOREURL) + article.articles_thumbnail;
};
