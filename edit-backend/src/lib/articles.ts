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

export async function getArticles({
  search,
  authorId,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  authorId?: number;
  page?: number;
  pageSize?: number;
}): Promise<{
  articles: {
    articles_id: number;
    articles_slug: string | null;
    articles_published: Date | null;
    articles_updated: Date | null;
    articles_showInLists: boolean;
    articles_showInSearch: boolean;
    editions_id: number | null;
    articles_authors: {
      users_userid: number;
      users_name1: string | null;
      users_name2: string | null;
    }[];
    articles_categories: {
      categories_id: number;
      category: {
        categories_displayName: string | null;
        categories_backgroundColor: string | null;
        categories_backgroundColorContrast: string | null;
      };
    }[];
    articlesDrafts: {
      articlesDrafts_headline: string;
      articlesDrafts_excerpt: string | null;
    }[];
    edition: {
      editions_printNumber: number | null;
    } | null;
    users: {
      users: {
        users_userid: number;
        users_name1: string | null;
        users_name2: string | null;
      };
    }[];
  }[];
  pagination: {
    page: number;
    totalPages: number;
  };
}> {
  const where: any = { articles_showInAdmin: true };

  if (search && search.length > 0) {
    where.OR = [
      { articles_slug: { contains: search, mode: "insensitive" } },
      {
        articlesDrafts: {
          some: {
            OR: [
              {
                articlesDrafts_headline: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                articlesDrafts_excerpt: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      },
    ];
  }

  if (authorId && authorId !== 0) {
    where.users = { some: { users_userid: authorId } };
  }

  const [articles, totalCount] = await Promise.all([
    prisma.articles.findMany({
      where,
      orderBy: { articles_published: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        edition: {
          select: {
            editions_id: true,
            editions_printNumber: true,
          },
        },
        articlesDrafts: {
          orderBy: { articlesDrafts_timestamp: "desc" },
          take: 1,
          select: {
            articlesDrafts_headline: true,
            articlesDrafts_excerpt: true,
          },
        },
        users: {
          select: {
            users: {
              select: {
                users_userid: true,
                users_name1: true,
                users_name2: true,
                users_deleted: true,
              },
            },
          },
        },
        categories: {
          select: {
            categories_id: true,
            category: {
              select: {
                categories_displayName: true,
                categories_backgroundColor: true,
                categories_backgroundColorContrast: true,
              },
            },
          },
        },
      },
    }),
    prisma.articles.count({ where }),
  ]);

  return {
    articles: articles.map((a) => ({
      ...a,
      articles_authors: a.users
        .filter((u) => !u.users.users_deleted)
        .map((u) => ({
          users_userid: u.users.users_userid,
          users_name1: u.users.users_name1,
          users_name2: u.users.users_name2,
        })),
      articles_categories: a.categories.map((c) => c),
    })),
    pagination: {
      page,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}
