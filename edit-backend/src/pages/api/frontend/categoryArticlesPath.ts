import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { ParseForm } from "@/lib/parseForm";
import { ArticleAuthor, IArticleFull, ICategoryArticles } from "@/lib/types";
import { getArticleImage } from "@/lib/articles";
import dateFormatter from "@/lib/dateFormatter";
import { getCategoryLink } from "@/lib/categories";
import he from "he";
import { z } from "zod";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

// Disable Next.js body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const formSchema = z.object({
  categoryName: z.preprocess(
    (val: unknown) => (Array.isArray(val) ? val[0] : val),
    z
      .string()
      .trim()
      .min(1, "Category name is required")
      .max(100)
      .regex(/^[a-zA-Z0-9\-_ ]+$/, "Invalid category name"),
  ),
  take: z.preprocess(
    (val: unknown) => {
      const strVal = Array.isArray(val) ? val[0] : val;
      return parseInt(strVal, 10);
    },
    z
      .number()
      .int()
      .min(0, "Invalid 'take' value")
      .max(100, "Invalid 'take' value"),
  ),
  skip: z.preprocess(
    (val: unknown) => {
      const strVal = Array.isArray(val) ? val[0] : val;
      return parseInt(strVal, 10);
    },
    z
      .number()
      .int()
      .min(0, "Invalid 'skip' value")
      .max(10000, "Invalid 'skip' value"),
  ),
  notInFeatured: z
    .preprocess((val: unknown) => {
      const strVal = Array.isArray(val) ? val[0] : val;
      if (!strVal || !strVal.trim()) return [];
      return String(strVal)
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n > 0);
    }, z.array(z.number().int().positive()))
    .optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  cors(res);

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const { fields } = await ParseForm(req);
    const parsed = formSchema.safeParse({
      categoryName: fields.categoryName,
      take: fields.take,
      skip: fields.skip,
      notInFeatured: fields.notInFeatured,
    });

    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid request", errors: parsed.error.errors });
      return;
    }
    const { categoryName, take, skip, notInFeatured } = parsed.data;

    const category = await prisma.categories.findFirst({
      where: {
        categories_name: String(categoryName),
        categories_showPublic: true,
        categories_showMenu: true,
      },
      include: {
        articles: {
          take: Number(String(take)),
          skip: Number(String(skip)),
          where: {
            article: {
              articles_showInLists: true,
              ...(notInFeatured?.length
                ? {
                    NOT: {
                      articles_id: {
                        in: notInFeatured,
                      },
                    },
                  }
                : {}),
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

    if (!category) {
      res.status(400).json({ message: "Category articles not found" });
      return;
    }

    const articles: IArticleFull[] = await Promise.all(
      category.articles.map(async ({ article }) => {
        const s3url = await getArticleImage(article);

        const authors: ArticleAuthor[] = article.users.map(({ users }) => {
          const author: ArticleAuthor = {
            users_userid: users.users_userid,
            users_name1: he.decode(users.users_name1 || ""),
            users_name2: he.decode(users.users_name2 || ""),
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
            id: category.categories_id,
            name: category.categories_name,
            displayName: category.categories_displayName,
            colour: category.categories_backgroundColor,
            link: getCategoryLink(
              String(category.categories_name),
              Number(category.categories_nestUnder),
            ),
            nestUnder: category.categories_nestUnder,
          },
          categories: null,
          similarArticles: null,
        };

        return articleNew;
      }),
    );

    const categoryWithArticles: ICategoryArticles = {
      ...category,
      articles: articles,
    };

    // const categoriesWithArticles: ICategoryArticles[] = await Promise.all(category.map(async (c) => {
    //     const articles: IArticleFull[] = await Promise.all(c.articles.map(
    //         async ({article}) => {
    //             const s3url = await getArticleImage(article);
    //
    //             const authors: ArticleAuthor[] = article.users.map(({users}) => {
    //                 const author: ArticleAuthor = {
    //                     users_userid: users.users_userid,
    //                     users_name1: String(users.users_name1),
    //                     users_name2: String(users.users_name2),
    //                 }
    //
    //                 return author;
    //             })
    //
    //             const articleNew: IArticleFull = {
    //                 id: article.articles_id,
    //                 articleURL: `${
    //                     process.env.FRONTEND_URL
    //                 }articles/${dateFormatter
    //                     .format(article.articles_published || new Date(0)) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
    //                     .split("/")
    //                     .reverse()
    //                     .join("/")}/${String(article.articles_slug)}`,
    //                 thumbnailURL: s3url,
    //                 isThumbnailPortrait: article.articles_isThumbnailPortrait,
    //                 thumbnailCredit: article.articlesDrafts[0].articlesDrafts_thumbnailCredit,
    //                 headline: article.articlesDrafts.length != 0
    //                     ? article.articlesDrafts[0].articlesDrafts_headline
    //                     : "Unknown",
    //                 excerpt: article.articlesDrafts.length != 0
    //                     ? article.articlesDrafts[0].articlesDrafts_excerpt
    //                     : "Unknown",
    //                 published: dateFormatter.format(article.articles_published || new Date(0))
    //                     .split("/")
    //                     .reverse()
    //                     .join("/"),
    //                 displayImages: Boolean(article.articles_displayImages),
    //                 text: null,
    //                 articleType: null,
    //                 authors: authors,
    //                 parentCategory: {
    //                     id: c.categories_id,
    //                     name: c.categories_name,
    //                     displayName: c.categories_displayName,
    //                     colour: c.categories_backgroundColor,
    //                     link: getCategoryLink(
    //                         String(c.categories_name),
    //                         Number(c.categories_nestUnder)
    //                     ),
    //                     nestUnder: c.categories_nestUnder,
    //                 },
    //                 categories: null,
    //                 similarArticles: null,
    //             }
    //
    //             return articleNew;
    //         }
    //     ));
    //
    //     const category: ICategoryArticles = {
    //         ...c,
    //         articles: articles
    //     };
    //
    //     return category;
    // }));

    res.status(200).json(categoryWithArticles);
  } catch (err) {
    console.error("Error in categoryArticlesPath:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
