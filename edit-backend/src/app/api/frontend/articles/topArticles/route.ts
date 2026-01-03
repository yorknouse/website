import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import type { ArticleAuthor, TopArticleResult } from "@/lib/types";
import { getArticleImage } from "@/lib/articles";
import { Prisma } from "@prisma/client";
import he from "he";
import { NextResponse } from "next/server";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

export async function GET(_: Request) {
  try {
    const summary = await cache("articlesReadSummary:latest", 7200, () =>
      prisma.articlesReadsSummary.findMany({
        orderBy: { read_count: "desc" },
        take: 4,
        select: {
          articles_id: true,
          read_count: true,
          updated_at: true,
        },
        distinct: "articles_id",
      }),
    );

    const articlesID: {
      articles_id: number;
      read_count: number;
      updated_at: Date;
    }[] = summary.map(
      (s: {
        articles_id: number;
        read_count: number;
        updated_at: Date;
      }): { articles_id: number; read_count: number; updated_at: Date } => s,
    );

    let articleIds = articlesID.map((id) => id.articles_id);

    if (articleIds.length == 0) {
      articleIds.push(0);
    }

    const cacheKey = `topArticles:${articleIds.join(",")}`;
    const queryString = Prisma.sql`
            SELECT DISTINCT articles.articles_id,
                   articles.articles_published,
                   articles.articles_slug,
                   articles.articles_thumbnail,
                   articles.articles_isThumbnailPortrait,
                   articles.articles_displayImages,
                   ad.articlesDrafts_headline
            FROM articles
            LEFT JOIN (
                SELECT t1.*
                    FROM articlesDrafts t1
                    INNER JOIN (
                        SELECT DISTINCT articles_id, MAX(articlesDrafts_timestamp) AS max_ts
                        FROM articlesDrafts
                        GROUP BY articles_id
                    ) t2 ON t1.articles_id = t2.articles_id AND t1.articlesDrafts_timestamp = t2.max_ts
            ) ad ON articles.articles_id = ad.articles_id
            LEFT JOIN nouse.articlesAuthors aA on articles.articles_id = aA.articles_id
            WHERE articles.articles_id IN (${Prisma.join(articleIds)})
        `;

    const articles = await cache<TopArticleResult[]>(cacheKey, 7200, () =>
      prisma.$queryRaw(queryString),
    );

    const output = await Promise.all(
      articles.map(async (article) => {
        const headline = article.articlesDrafts_headline;
        const categoriesLinks = await cache<
          {
            articles_id: number;
            categories_id: number;
          }[]
        >(`categoriesLinks:articles_id:${article.articles_id}`, 7200, () =>
          prisma.articlesCategories.findMany({
            where: { articles_id: article.articles_id },
            select: {
              articles_id: true,
              categories_id: true,
            },
          }),
        );

        let categoryName = null;
        if (categoriesLinks.length > 0) {
          const categoryIds = categoriesLinks.map((c) => c.categories_id);
          const cacheKey = `categoriesList:${categoryIds.join(",")}`;
          const topCategory = await cache(cacheKey, 7200, () =>
            prisma.categories.findFirst({
              where: {
                categories_id: {
                  in: categoryIds,
                },
                categories_nestUnder: null,
              },
            }),
          );
          categoryName = topCategory?.categories_name ?? null;
        }

        const authors = await cache<
          {
            users: {
              users_userid: number;
              users_name1: string | null;
              users_name2: string | null;
            };
          }[]
        >(`authors:articleId:${article.articles_id}`, 7200, () =>
          prisma.articlesAuthors.findMany({
            where: {
              articles_id: article.articles_id,
              users: {
                users_deleted: false,
              },
            },
            include: {
              users: {
                select: {
                  users_userid: true,
                  users_name1: true,
                  users_name2: true,
                },
              },
            },
          }),
        );

        return {
          ...article,
          articlesDrafts_headline: headline,
          categories_name: categoryName,
          articles_authors: authors.map((a) => {
            const author: ArticleAuthor = {
              users_name1: he.decode(a.users.users_name1 || ""),
              users_name2: he.decode(a.users.users_name2 || ""),
              users_userid: a.users.users_userid,
            };
            return author;
          }),
          url:
            "/" +
            new Date(article.articles_published as Date)
              .toISOString()
              .slice(0, 10)
              .replace(/-/g, "/") +
            "/" +
            article.articles_slug,
          image: await getArticleImage(article, "medium"),
        };
      }),
    );

    return NextResponse.json({ result: true, response: output }, corsRes);
  } catch (err) {
    console.error("Error in topArticles", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
