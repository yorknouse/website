import { Prisma, type articles } from "@prisma/client";
import prisma from "../../prisma";
import { s3URL } from "./s3URL";
import dateFormatter from "./dateFormatter";

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

const articleWithUserAndDraft = Prisma.validator()({
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

export type articleWithUserAndDraft = Prisma.articlesGetPayload<
  typeof articleWithUserAndDraft
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

  return prisma.articles.findMany({
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
 * Retrieves all articles in the dB.
 * @returns {Promise<articleWithUserAndDraft[]>} Promise object represents the articles.
 */
export const getAllArticles = async (): Promise<articleWithUserAndDraft[]> => {
  const nArticles = await prisma.articles.count();

  // Split retrieval in blocks so that Node does not take
  // too much memory.
  const blockSize = 1000;

  const articles: articleWithUserAndDraft[] = [];

  for (let i = 0; i < Math.ceil(nArticles / blockSize); i++) {
    const block = await prisma.articles.findMany({
      where: {
        articles_showInLists: true,
      },
      take: blockSize,
      skip: i * blockSize,
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
    articles.push(...block);
  }

  return articles;
};

/**
 * Gets 4 article with same parent category as the passed one.
 * @param {number} parentCategoryId The parent category id.
 * @returns {Promise<articlesWithArticleDrafts[]>} Promise object represents the articles.
 */
export const getSimilarArticles = async (
  parentCategoryId: number
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
    },
    orderBy: {
      articles_published: "desc",
    },
    take: 5,
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

/**
 * Returns string url to article.
 * @param article The article.
 * @param base Optional base url to use. MUST include trailing slash.
 * @returns The string url.
 */
export const getArticleLink = (article: articles, base?: string) => {
  // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
  return `${base ?? import.meta.env.BASE_URL}articles/${dateFormatter
    .format(article.articles_published || new Date(0))
    .split("/")
    .reverse()
    .join("/")}/${article.articles_slug}`;
};
