import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
import { cache } from "@/lib/cache";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

function getArticlesFromList(articleIds: number[]) {
  return async () => {
    return prisma.articles.findMany({
      where: {
        articles_id: { in: articleIds },
        articles_showInLists: true,
      },
      include: {
        articlesDrafts: {
          orderBy: { articlesDrafts_timestamp: "desc" },
          take: 1,
        },
        categories: {
          include: { category: true },
        },
        users: {
          include: { users: true },
        },
      },
    });
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const articleIdsRaw = formData.get("articleIds");
    const styleRaw = formData.get("style");

    if (
      !styleRaw ||
      (String(styleRaw) !== "nouse" && String(styleRaw) !== "muse")
    ) {
      return NextResponse.json(
        { message: "Invalid style" },
        { status: 400, headers: corsHeaders },
      );
    }

    const style = String(styleRaw);

    if (!articleIdsRaw || typeof articleIdsRaw !== "string") {
      return NextResponse.json(
        { message: "Missing articleIds" },
        { status: 400, headers: corsHeaders },
      );
    }

    let articleIds: number[];
    try {
      const parsed = JSON.parse(articleIdsRaw);

      const schema = z.array(z.number().int().nonnegative()).nonempty();
      const validation = schema.safeParse(parsed);

      if (!validation.success) {
        return NextResponse.json(
          { message: "Invalid articleIds format" },
          { status: 400, headers: corsHeaders },
        );
      }

      articleIds = validation.data;
    } catch {
      return NextResponse.json(
        { message: "Malformed articleIds JSON" },
        { status: 400, headers: corsHeaders },
      );
    }

    const cacheKey = `articlesList:${style}:${articleIds.join(",")}`;

    const data = await cache(cacheKey, 7200, getArticlesFromList(articleIds));

    if (!data) {
      return NextResponse.json(
        { message: "Failed to find articles" },
        { status: 404, headers: corsHeaders },
      );
    }

    type Category = {
      id: number;
      name: string;
      displayName: string | null;
      colour: string | null;
      nestUnder: number | null;
    };

    const categories = new Map(
      data.map((article) => {
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

    const articles: IArticleFull[] = await Promise.all(
      data.map(async (article1) => {
        const s3url = await getArticleImage(article1);

        const authors: ArticleAuthor[] = article1.users.map(({ users }) => ({
          users_userid: users.users_userid,
          users_name1: he.decode(users.users_name1 || ""),
          users_name2: he.decode(users.users_name2 || ""),
        }));

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

        const publishedDate = article1.articles_published
          ? new Date(article1.articles_published)
          : new Date(0);

        return {
          id: article1.articles_id,
          articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
            .format(publishedDate)
            .split("/")
            .reverse()
            .join("/")}/${String(article1.articles_slug)}`,
          thumbnailURL: s3url,
          isThumbnailPortrait: article1.articles_isThumbnailPortrait,
          thumbnailCredit:
            article1.articlesDrafts[0]?.articlesDrafts_thumbnailCredit ?? null,
          headline:
            article1.articlesDrafts[0]?.articlesDrafts_headline ?? "Unknown",
          excerpt: article1.articlesDrafts[0]?.articlesDrafts_excerpt ?? null,
          published: dateFormatter
            .format(publishedDate)
            .split("/")
            .reverse()
            .join("/"),
          displayImages: Boolean(article1.articles_displayImages),
          text: null,
          articleType: null,
          authors,
          parentCategory: category,
          categories: articleCategories,
          similarArticles: null,
        };
      }),
    );

    return NextResponse.json(articles, {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Error in articles:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
