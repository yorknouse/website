import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { ArticleAuthor, ArticleCategory, IArticle } from "@/lib/types";
import { getArticleImage, getSimilarArticles } from "@/lib/articles";
import dateFormatter from "@/lib/dateFormatter";
import { getCategoryLink, getParentCategory } from "@/lib/categories";
import crypto from "crypto";
import he from "he";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";
import { Prisma } from "@prisma/client";
import { validatePreviewToken } from "@/lib/preview";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  const { slug } = await params;

  try {
    if (!slug) {
      return NextResponse.json({ message: "Missing slug" }, { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");
    const hashHeader = req.headers.get("X-Preview-Hash");
    const validToken = validatePreviewToken(authHeader);

    const isPreview =
      hashHeader !== undefined && typeof hashHeader === "string" && validToken;

    let categoriesWhere: Prisma.articlesCategoriesWhereInput = {
      category: {
        categories_showPublic: true,
      },
    };
    if (isPreview) {
      categoriesWhere = {};
    }

    const slugSanitised = sanitiseSearchTerm(slug);

    if (!slugSanitised || "") {
      return NextResponse.json({ message: "Invalid slug" }, { status: 400 });
    }

    const cleanSlug = decodeURIComponent(slugSanitised);

    const articleRaw = await cache(`article:slug:${cleanSlug}`, 7200, () =>
      prisma.articles.findFirst({
        where: {
          articles_showInLists: !isPreview,
          articles_slug: cleanSlug,
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
            where: categoriesWhere,
            include: {
              category: true,
            },
          },
          users: {
            include: { users: true },
          },
        },
      }),
    );

    if (!articleRaw) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 },
      );
    }

    if (isPreview) {
      const expectedHash = crypto
        .createHash("md5")
        .update(String(articleRaw.articles_id))
        .digest("hex");
      if (expectedHash !== hashHeader) {
        return NextResponse.json(
          { message: "Article not found" },
          { status: 404 },
        );
      }
    }
    if (articleRaw.articlesDrafts.length <= 0) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 },
      );
    }
    if (!articleRaw.articlesDrafts![0]) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 },
      );
    }

    const imageURL = await getArticleImage(articleRaw);

    const authors: ArticleAuthor[] = articleRaw.users.map(({ users }) => {
      const author: ArticleAuthor = {
        users_userid: users.users_userid,
        users_name1: he.decode(users.users_name1 || ""),
        users_name2: he.decode(users.users_name2 || ""),
      };

      return author;
    });

    const categories: ArticleCategory[] = articleRaw.categories.map(
      ({ category }) => {
        const cat: ArticleCategory = {
          id: category.categories_id,
          name: category.categories_name,
          displayName: category.categories_displayName,
          colour: category.categories_backgroundColor,
          link: getCategoryLink(
            String(category.categories_name),
            Number(category.categories_nestUnder),
          ),
          nestUnder: category.categories_nestUnder,
        };
        return cat;
      },
    );

    const temp = getParentCategory(articleRaw.categories);

    const category: ArticleCategory = {
      id: temp.categories_id,
      name: temp.categories_name,
      displayName: temp.categories_displayName,
      colour: String(temp.categories_backgroundColor),
      link: getCategoryLink(
        String(temp.categories_name),
        Number(temp.categories_nestUnder),
      ),
      nestUnder: temp.categories_nestUnder,
    };

    const similarRaw = await getSimilarArticles(
      category.id,
      articleRaw.articles_id,
    );
    const similar = await Promise.all(
      similarRaw.map(async (similarArticle) => {
        const authorsSimilar: ArticleAuthor[] = similarArticle.users.map(
          ({ users }) => {
            const author: ArticleAuthor = {
              users_userid: users.users_userid,
              users_name1: he.decode(users.users_name1 || ""),
              users_name2: he.decode(users.users_name2 || ""),
            };

            return author;
          },
        );

        const temp = getParentCategory(similarArticle.categories);

        const imageURL1 = await getArticleImage(similarArticle);

        const category: ArticleCategory = {
          id: temp.categories_id,
          name: temp.categories_name,
          displayName: temp.categories_displayName,
          colour: String(temp.categories_backgroundColor),
          link: getCategoryLink(
            String(temp.categories_name),
            Number(temp.categories_nestUnder),
          ),
          nestUnder: temp.categories_nestUnder,
        };

        const publishedDate = similarArticle.articles_published
          ? new Date(similarArticle.articles_published)
          : new Date(0);

        const similar: IArticle = {
          id: similarArticle.articles_id,
          headline:
            similarArticle.articlesDrafts.length != 0
              ? similarArticle.articlesDrafts[0].articlesDrafts_headline
              : "Unknown",
          excerpt:
            similarArticle.articlesDrafts.length != 0
              ? similarArticle.articlesDrafts[0].articlesDrafts_excerpt
              : null,
          articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
            .format(publishedDate) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
            .split("/")
            .reverse()
            .join("/")}/${String(similarArticle.articles_slug)}`,
          thumbnailURL: imageURL1,
          isThumbnailPortrait: similarArticle.articles_isThumbnailPortrait,
          authors: authorsSimilar,
          parentCategory: category,
          displayImages: Boolean(similarArticle.articles_displayImages),
          categories: null,
          text: null,
          thumbnailCredit: null,
          articleType: null,
          published: null,
          similarArticles: null,
        };
        return similar;
      }),
    );

    const publishedDate = articleRaw.articles_published
      ? new Date(articleRaw.articles_published)
      : new Date(0);

    const article: IArticle = {
      id: articleRaw.articles_id,
      articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
        .format(publishedDate) // split -> reverse -> join = DD/MM/YYYY -> YYYY/MM/DD
        .split("/")
        .reverse()
        .join("/")}/${String(articleRaw.articles_slug)}`,
      thumbnailURL: imageURL,
      isThumbnailPortrait: articleRaw.articles_isThumbnailPortrait,
      thumbnailCredit:
        articleRaw.articlesDrafts![0].articlesDrafts_thumbnailCredit,
      headline:
        articleRaw.articlesDrafts.length != 0
          ? articleRaw.articlesDrafts![0].articlesDrafts_headline
          : "Unknown",
      excerpt:
        articleRaw.articlesDrafts.length != 0
          ? articleRaw.articlesDrafts![0].articlesDrafts_excerpt
          : null,
      published: dateFormatter
        .format(publishedDate)
        .split("/")
        .reverse()
        .join("/"),
      text: articleRaw.articlesDrafts![0].articlesDrafts_text,
      articleType: articleRaw.articles_type,
      authors: authors,
      parentCategory: category,
      categories: categories,
      similarArticles: similar,
      displayImages: articleRaw.articles_displayImages!,
    };

    return NextResponse.json(article);
  } catch (err) {
    console.error("Error in article:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
