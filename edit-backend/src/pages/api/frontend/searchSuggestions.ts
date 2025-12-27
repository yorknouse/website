import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { ParseForm } from "@/lib/parseForm";
import { getArticleImage } from "@/lib/articles";
import type { ArticleAuthor } from "@/lib/types";
import he from "he";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";
import { Prisma } from "@prisma/client";

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

    const ftTerm = term
      .split(/\s+/)
      .map((w) => `+${w}*`)
      .join(" ");

    // Match authors
    const matchingAuthors1 = await prisma.$queryRaw<{ users_userid: number }[]>`
      SELECT users_userid
      FROM users
      WHERE MATCH(users_name1, users_name2) AGAINST (${ftTerm} IN BOOLEAN MODE)
    `;

    const authorIds =
      matchingAuthors1.length > 0
        ? matchingAuthors1.map((a) => a.users_userid)
        : [-1];

    // Articles matching drafts
    const matchingArticleIdsFT = await prisma.$queryRaw<
      { articles_id: number }[]
    >`
      SELECT a.articles_id
      FROM articles a
             JOIN articlesDrafts d
                  ON d.articles_id = a.articles_id
      WHERE a.articles_showInSearch = 1
        AND a.articles_published <= NOW()
        AND MATCH(d.articlesDrafts_headline, d.articlesDrafts_excerpt)
                  AGAINST (${ftTerm} IN BOOLEAN MODE)
    `;

    // Articles by authorIds
    const matchingArticleIdsAuthors = await prisma.$queryRaw<
      { articles_id: number }[]
    >`
      SELECT DISTINCT aa.articles_id
      FROM articlesAuthors aa
      WHERE aa.users_userid IN (${Prisma.join(authorIds)})
    `;

    // Combine IDs
    const combinedIds = [
      ...matchingArticleIdsFT.map((a) => Number(a.articles_id)),
      ...matchingArticleIdsAuthors.map((a) => Number(a.articles_id)),
    ];

    // Fetch full articles
    const articles = await prisma.articles.findMany({
      where: {
        articles_id: { in: combinedIds },
        articles_showInSearch: true,
        articles_published: { lte: new Date() },
      },
      orderBy: { articles_published: "desc" },
      include: {
        articlesDrafts: {
          orderBy: { articlesDrafts_timestamp: "desc" },
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
          where: { users: { users_deleted: false } },
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
