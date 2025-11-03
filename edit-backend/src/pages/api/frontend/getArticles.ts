import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { ParseForm } from "@/lib/parseForm";
import { getArticleImage } from "@/lib/articles";
import {
  ArticleAuthor,
  ArticleCategory,
  IArticleFull,
  ICategory,
} from "@/lib/types";
import { getCategoryLink, getParentCategory } from "@/lib/categories";
import dateFormatter from "@/lib/dateFormatter";
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
    const articleIdsRaw = fields.articleIds;
    const styleRaw = fields.style;

    if (
      !styleRaw ||
      (String(styleRaw) !== "nouse" && String(styleRaw) !== "muse")
    ) {
      res.status(400).json({ message: `Invalid style` });
      return;
    }

    const style = String(styleRaw);

    // Safely parse articleIds
    let articleIds: number[];
    try {
      const parsed = JSON.parse(String(articleIdsRaw));

      const schema = z.array(z.number().int().positive()).nonempty();
      const validation = schema.safeParse(parsed);

      if (!validation.success) {
        res.status(400).json({ message: "Invalid articleIds format" });
        return;
      }

      articleIds = validation.data;
    } catch {
      res.status(400).json({ message: "Malformed articleIds JSON" });
      return;
    }

    const result = await prisma.articles.findMany({
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

    if (!result) {
      res.status(404).json({ message: "Failed to find articles" });
    }

    type Category = {
      id: number;
      name: string;
      displayName: string | null;
      colour: string | null;
      nestUnder: number | null;
    };

    const categories = new Map(
      result.map((article) => {
        const temp = getParentCategory(article.categories);
        const cat: Category = {
          id: temp.categories_id,
          name: temp.categories_name,
          displayName: temp.categories_displayName,
          colour: temp.categories_backgroundColor,
          nestUnder: temp.categories_nestUnder,
        };
        return [article.articles_id, cat];
      }),
    );

    const articles = await Promise.all(
      result.map(async (article1) => {
        const s3url = await getArticleImage(article1);

        const authors: ArticleAuthor[] = article1.users.map(({ users }) => {
          const author: ArticleAuthor = {
            users_userid: users.users_userid,
            users_name1: he.decode(users.users_name1 || ""),
            users_name2: he.decode(users.users_name2 || ""),
          };

          return author;
        });

        const category: ArticleCategory = {
          id: Number(categories.get(article1.articles_id)?.id),
          name: String(categories.get(article1.articles_id)?.name),
          displayName: String(
            categories.get(article1.articles_id)?.displayName,
          ),
          colour: String(categories.get(article1.articles_id)?.colour),
          link: getCategoryLink(
            String(categories.get(article1.articles_id)?.name),
            Number(categories.get(article1.articles_id)?.nestUnder),
          ),
          nestUnder: categories.get(article1.articles_id)!.nestUnder,
        };

        const articleCategories: ICategory[] = article1.categories
          .filter(
            ({ category }) =>
              category.categories_nestUnder ===
                (style === "nouse" ? null : 4) &&
              category.categories_showPublic &&
              category.categories_showHome,
          )
          .map(({ category }) => category);

        const article: IArticleFull = {
          id: article1.articles_id,
          articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
            .format(article1.articles_published || new Date(0)) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
            .split("/")
            .reverse()
            .join("/")}/${String(article1.articles_slug)}`,
          thumbnailURL: s3url,
          isThumbnailPortrait: article1.articles_isThumbnailPortrait,
          thumbnailCredit:
            article1.articlesDrafts[0].articlesDrafts_thumbnailCredit,
          headline:
            article1.articlesDrafts.length != 0
              ? article1.articlesDrafts[0].articlesDrafts_headline
              : "Unknown",
          excerpt:
            article1.articlesDrafts.length != 0
              ? article1.articlesDrafts[0].articlesDrafts_excerpt
              : "Unknown",
          published: dateFormatter
            .format(article1.articles_published || new Date(0))
            .split("/")
            .reverse()
            .join("/"),
          displayImages: Boolean(article1.articles_displayImages),
          text: null,
          articleType: null,
          authors: authors,
          parentCategory: category,
          categories: articleCategories,
          similarArticles: null,
        };

        return article;
      }),
    );

    res.status(200).json(articles);
  } catch (err) {
    console.error("Error in registerRead:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
