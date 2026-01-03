import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCategoryLink } from "@/lib/categories";
import { getArticleImage } from "@/lib/articles";
import { ArticleAuthor, IArticleFull, ICategoryArticles } from "@/lib/types";
import dateFormatter from "@/lib/dateFormatter";
import he from "he";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

const querySchema = z.object({
  parent: z.coerce.number().int().nonnegative(),
  limit: z.coerce.number().int().min(0).max(50).default(10),
});

function getCategoriesTree(parent: number, limit: number) {
  return () =>
    prisma.categories.findMany({
      where: {
        categories_showPublic: true,
        categories_showMenu: true,
        categories_nestUnder: parent,
      },
      include: {
        articles: {
          take: limit,
          where: {
            article: {
              articles_showInLists: true,
            },
          },
          orderBy: {
            article: {
              articles_published: "desc",
            },
          },
          include: {
            article: {
              include: {
                articlesDrafts: {
                  orderBy: {
                    articlesDrafts_timestamp: "desc",
                  },
                  take: 1,
                },
                categories: {
                  include: { category: true },
                },
                users: {
                  include: { users: true },
                },
              },
            },
          },
        },
      },
    });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      parent: searchParams.get("parent"),
      limit: searchParams.get("limit"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid query parameters" },
        { status: 400 },
      );
    }

    const { parent, limit } = parsed.data;

    const cacheKey = `categoriesTree:parent:${parent}:limit:${limit}`;

    const rawCategories = await cache(
      cacheKey,
      7200,
      getCategoriesTree(parent, limit),
    );

    if (!rawCategories || rawCategories.length === 0) {
      return NextResponse.json(
        { message: "Categories not found" },
        { status: 404 },
      );
    }

    const categories: ICategoryArticles[] = await Promise.all(
      rawCategories.map(async (c) => {
        const articles: IArticleFull[] = await Promise.all(
          c.articles.map(async ({ article }) => {
            const s3url = await getArticleImage(article);

            const authors: ArticleAuthor[] = article.users.map(({ users }) => ({
              users_userid: users.users_userid,
              users_name1: he.decode(users.users_name1 || ""),
              users_name2: he.decode(users.users_name2 || ""),
            }));

            const publishedDate = article.articles_published
              ? new Date(article.articles_published)
              : new Date(0);

            return {
              id: article.articles_id,
              articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
                .format(publishedDate)
                .split("/")
                .reverse()
                .join("/")}/${article.articles_slug}`,
              thumbnailURL: s3url,
              isThumbnailPortrait: article.articles_isThumbnailPortrait,
              thumbnailCredit:
                article.articlesDrafts[0]?.articlesDrafts_thumbnailCredit ??
                null,
              headline:
                article.articlesDrafts[0]?.articlesDrafts_headline ?? "Unknown",
              excerpt:
                article.articlesDrafts[0]?.articlesDrafts_excerpt ?? null,
              published: dateFormatter
                .format(publishedDate)
                .split("/")
                .reverse()
                .join("/"),
              displayImages: Boolean(article.articles_displayImages),
              text: null,
              articleType: null,
              authors,
              parentCategory: {
                id: c.categories_id,
                name: c.categories_name,
                displayName: c.categories_displayName,
                colour: c.categories_backgroundColor,
                link: getCategoryLink(
                  String(c.categories_name),
                  Number(c.categories_nestUnder),
                ),
                nestUnder: c.categories_nestUnder,
              },
              categories: null,
              similarArticles: null,
            };
          }),
        );

        return {
          ...c,
          articles,
        };
      }),
    );

    return NextResponse.json(categories, corsRes);
  } catch (err) {
    console.error("Error in categories tree:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
