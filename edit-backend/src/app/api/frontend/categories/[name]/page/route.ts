import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ArticleAuthor, IArticleFull, ICategoryArticles } from "@/lib/types";
import { getArticleImage } from "@/lib/articles";
import he from "he";
import dateFormatter from "@/lib/dateFormatter";
import { getCategoryLink } from "@/lib/categories";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  },
};

type RouteParams = {
  params: Promise<{
    name: string;
  }>;
};

function getCategory(
  categoryName: string,
  take: number,
  skip: number,
  notInFeatured: number[] | undefined,
) {
  return () =>
    prisma.categories.findFirst({
      where: {
        categories_name: categoryName,
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
}

const formSchema = z.object({
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

export async function POST(request: Request, { params }: RouteParams) {
  const { name } = await params;

  try {
    if (!name) {
      return NextResponse.json({ message: "Missing name" }, { status: 400 });
    }

    const nameSanitised = sanitiseSearchTerm(name);
    if (!nameSanitised || nameSanitised.length == 0) {
      return NextResponse.json(
        { message: "Missing or invalid name" },
        { status: 400 },
      );
    }

    const formData = await request.formData();

    const parsed = formSchema.safeParse({
      take: formData.get("take"),
      skip: formData.get("skip"),
      notInFeatured: formData.get("notInFeatured"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.message },
        { status: 400 },
      );
    }
    const { take, skip, notInFeatured } = parsed.data;

    const notInKey = notInFeatured?.length ? notInFeatured.join(",") : "none";

    const cacheKey = `categoryPage:name:${nameSanitised}:take:${take}:skip:${skip}:notIn:${notInKey}`;

    const category = await cache(
      cacheKey,
      7200,
      getCategory(nameSanitised, take, skip, notInFeatured),
    );

    if (!category) {
      return NextResponse.json(
        { message: "Category articles not found" },
        { status: 404 },
      );
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

        const publishedDate = article.articles_published
          ? new Date(article.articles_published)
          : new Date(0);

        const articleNew: IArticleFull = {
          id: article.articles_id,
          articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
            .format(publishedDate) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
            .split("/")
            .reverse()
            .join("/")}/${String(article.articles_slug)}`,
          thumbnailURL: s3url,
          isThumbnailPortrait: article.articles_isThumbnailPortrait,
          thumbnailCredit:
            article.articlesDrafts[0]?.articlesDrafts_thumbnailCredit || null,
          headline:
            article.articlesDrafts[0]?.articlesDrafts_headline || "Unknown",
          excerpt:
            article.articlesDrafts[0]?.articlesDrafts_excerpt || null,
          published: dateFormatter
            .format(publishedDate)
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

    return NextResponse.json(categoryWithArticles, corsRes);
  } catch (err) {
    console.error("Error in categories featured and count:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
