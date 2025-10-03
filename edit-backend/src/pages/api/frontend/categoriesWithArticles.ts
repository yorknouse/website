import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getCategoryLink } from "@/lib/categories";
import { getArticleImage } from "@/lib/articles";
import { ArticleAuthor, IArticleFull, ICategoryArticles } from "@/lib/types";
import dateFormatter from "@/lib/dateFormatter";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  cors(res);

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const { parentCategory, articlesLimit = "10" } = req.query;

  try {
    const categoriesWithArticlesRaw = await prisma.categories.findMany({
      where: {
        categories_showPublic: true,
        categories_showMenu: true,
        categories_nestUnder: Number(parentCategory),
      },
      include: {
        articles: {
          take: Number(articlesLimit),
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
                users: { include: { users: true } },
              },
            },
          },
        },
      },
    });
    if (!categoriesWithArticlesRaw || categoriesWithArticlesRaw.length === 0) {
      res.status(400).json({ message: "Categories with articles not found" });
      return;
    }

    const categoriesWithArticles: ICategoryArticles[] = await Promise.all(
      categoriesWithArticlesRaw.map(async (c) => {
        const articles: IArticleFull[] = await Promise.all(
          c.articles.map(async ({ article }) => {
            const s3url = await getArticleImage(article);

            const authors: ArticleAuthor[] = article.users.map(({ users }) => {
              const author: ArticleAuthor = {
                users_userid: users.users_userid,
                users_name1: String(users.users_name1),
                users_name2: String(users.users_name2),
              };

              return author;
            });

            const articleNew: IArticleFull = {
              id: article.articles_id,
              articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
                .format(article.articles_published || new Date(0)) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
                .split("/")
                .reverse()
                .join("/")}/${String(article.articles_slug)}`,
              thumbnailURL: s3url,
              isThumbnailPortrait: article.articles_isThumbnailPortrait,
              thumbnailCredit:
                article.articlesDrafts[0].articlesDrafts_thumbnailCredit,
              headline:
                article.articlesDrafts.length != 0
                  ? article.articlesDrafts[0].articlesDrafts_headline
                  : "Unknown",
              excerpt:
                article.articlesDrafts.length != 0
                  ? article.articlesDrafts[0].articlesDrafts_excerpt
                  : "Unknown",
              published: dateFormatter
                .format(article.articles_published || new Date(0))
                .split("/")
                .reverse()
                .join("/"),
              displayImages: Boolean(article.articles_displayImages),
              text: null,
              articleType: null,
              authors: authors,
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

            return articleNew;
          }),
        );

        const category: ICategoryArticles = {
          ...c,
          articles: articles,
        };

        return category;
      }),
    );

    res.status(200).json(categoriesWithArticles);
  } catch (err) {
    console.error("Error in categoriesWithArticles:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
