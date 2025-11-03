import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { ParseForm } from "@/lib/parseForm";
import { getArticleImage } from "@/lib/articles";
import type { ArticleAuthor } from "@/lib/types";
import he from "he";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

// Disable Next.js body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const rawTerm = fields.searchterm;

    if (!rawTerm || typeof rawTerm === "undefined") {
      res.status(400).json({ message: "Missing searchterm" });
      return;
    }

    const term = sanitiseSearchTerm(rawTerm);
    if (!term) {
      res.status(400).json({ message: "Invalid searchterm" });
      return;
    }

    const term1 = `%${rawTerm}%`;

    // 1. Match authors
    const matchingAuthors: { users_userid: number }[] =
      await prisma.users.findMany({
        where: {
          users_deleted: false,
          OR: [
            {
              users_name1: {
                contains: term1,
                // mode: "insensitive",
              },
            },
            {
              users_name2: {
                contains: term1,
                // mode: "insensitive",
              },
            },
            {
              // Name1 + Name2 full match (simulate CONCAT)
              AND: [
                {
                  users_name1: {
                    not: null,
                  },
                },
                {
                  users_name2: {
                    not: null,
                  },
                },
                {
                  AND: [
                    {
                      users_name1: {
                        contains: term.split(" ")[0],
                        // mode: "insensitive",
                      },
                    },
                    {
                      users_name2: {
                        contains: term.split(" ")[1] || "",
                        // mode: "insensitive",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        select: {
          users_userid: true,
        },
      });

    const authorIds =
      matchingAuthors.length > 0
        ? matchingAuthors.map((a) => a.users_userid)
        : [-1]; // Avoid empty IN clause

    // 2. Find matching articles with latest drafts
    const now = new Date();
    const articles = await prisma.articles.findMany({
      where: {
        articles_showInSearch: true,
        articles_published: {
          lte: now,
        },
        OR: [
          {
            articlesDrafts: {
              some: {
                OR: [
                  {
                    articlesDrafts_excerpt: {
                      contains: term1,
                      // mode: "insensitive",
                    },
                  },
                  {
                    articlesDrafts_headline: {
                      contains: term1,
                      // mode: "insensitive",
                    },
                  },
                ],
              },
            },
          },
          {
            articles_id: {
              in: (
                await prisma.articlesAuthors.findMany({
                  where: {
                    users_userid: { in: authorIds },
                  },
                  select: { articles_id: true },
                })
              ).map((a: { articles_id: number }) => a.articles_id),
            },
          },
        ],
      },
      orderBy: {
        articles_published: "desc",
      },
      include: {
        articlesDrafts: {
          orderBy: {
            articlesDrafts_timestamp: "desc",
          },
          take: 1,
        },
        categories: {
          select: {
            category: {
              select: {
                categories_id: true,
                categories_name: true,
                categories_displayName: true,
                categories_backgroundColor: true,
                categories_nestUnder: true,
              },
            },
          },
        },
        users: {
          where: {
            users: {
              users_deleted: false,
            },
          },
          select: {
            users: {
              select: {
                users_name1: true,
                users_name2: true,
                users_userid: true,
              },
            },
          },
        },
      },
    });

    const results = await Promise.all(
      articles.map(async (article) => {
        const draft = article.articlesDrafts[0];
        const category = article.categories
          .map((ac) => ac.category)
          .find((c) => c.categories_nestUnder === null);

        const image = await getArticleImage(article, "medium");

        return {
          articles_id: article.articles_id,
          articles_published: article.articles_published,
          articles_slug: article.articles_slug,
          articles_isThumbnailPortrait: article.articles_isThumbnailPortrait,
          articlesDrafts_headline: draft?.articlesDrafts_headline,
          articlesDrafts_excerpt: draft?.articlesDrafts_excerpt,
          url: `/${article.articles_published?.toISOString().split("T")[0].replace(/-/g, "/")}/${String(article.articles_slug)}`,
          image,
          articles_authors: article.users.map((aa) => {
            const author: ArticleAuthor = {
              users_name1: he.decode(aa.users.users_name1 || ""),
              users_name2: he.decode(aa.users.users_name2 || ""),
              users_userid: aa.users.users_userid,
            };
            return author;
          }),
          ...(category && {
            categories_name: category.categories_name,
            categories_displayName: category.categories_displayName,
            categories_backgroundColor: category.categories_backgroundColor,
          }),
        };
      }),
    );

    res.status(200).json({ result: true, response: results });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ message: err });
  }
}
