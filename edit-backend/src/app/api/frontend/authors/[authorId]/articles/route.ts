import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  ArticleAuthor,
  ArticleCategory,
  IArticle,
  IAuthorArticles,
} from "@/lib/types";
import { getArticleImage } from "@/lib/articles";
import dateFormatter from "@/lib/dateFormatter";
import { getCategoryLink, getParentCategory } from "@/lib/categories";
import he from "he";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

type RouteParams = {
  params: Promise<{
    authorId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { authorId } = await params;
  const { searchParams } = new URL(request.url);

  const pageParam = searchParams.get("page") ?? "1";
  const limitParam = searchParams.get("limit") ?? "10";

  const authorIdNumber = Number(authorId);
  if (!Number.isInteger(authorIdNumber) || authorIdNumber <= 0) {
    return NextResponse.json(
      { message: "Invalid authorId" },
      { status: 400, headers: corsHeaders },
    );
  }

  let pageNumber = Number(pageParam);
  let articlesPerPage = Number(limitParam);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) pageNumber = 1;
  if (
    !Number.isInteger(articlesPerPage) ||
    articlesPerPage < 1 ||
    articlesPerPage > 100
  ) {
    articlesPerPage = 10;
  }

  try {
    const authorArticles = await prisma.articlesAuthors.findMany({
      where: {
        users_userid: authorIdNumber,
      },
    });

    if (authorArticles.length === 0) {
      const empty: IAuthorArticles = { pages: 0, articles: [] };
      return NextResponse.json(empty, { headers: corsHeaders });
    }

    const pages = Math.ceil(authorArticles.length / articlesPerPage);
    const articleIds = authorArticles.map((a) => a.articles_id);

    const articlesRaw = await prisma.articles.findMany({
      where: {
        articles_id: { in: articleIds },
        articles_showInLists: true,
      },
      orderBy: {
        articles_published: "desc",
      },
      take: articlesPerPage,
      skip: (pageNumber - 1) * articlesPerPage,
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

    type Category = {
      id: number;
      name: string;
      displayName: string | null;
      colour: string | null;
      nestUnder: number | null;
    };

    const categories = new Map(
      articlesRaw.map((article) => {
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

    const articles: IArticle[] = await Promise.all(
      articlesRaw.map(async (article1) => {
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

        return {
          id: article1.articles_id,
          articleURL: `${process.env.FRONTEND_URL}articles/${dateFormatter
            .format(article1.articles_published || new Date(0))
            .split("/")
            .reverse()
            .join("/")}/${String(article1.articles_slug)}`,
          thumbnailURL: s3url,
          isThumbnailPortrait: article1.articles_isThumbnailPortrait,
          thumbnailCredit:
            article1.articlesDrafts[0]?.articlesDrafts_thumbnailCredit?.length !== 0 && article1.articlesDrafts[0]?.articlesDrafts_thumbnailCredit !== null
            ? String(article1.articlesDrafts[0]?.articlesDrafts_thumbnailCredit)
            : null,
          headline:
            article1.articlesDrafts[0]?.articlesDrafts_headline ?? "Unknown",
          excerpt: article1.articlesDrafts[0]?.articlesDrafts_excerpt?.length !== 0 && article1.articlesDrafts[0]?.articlesDrafts_excerpt !== null
            ? String(article1.articlesDrafts[0]?.articlesDrafts_excerpt)
            : null,
          published: dateFormatter
            .format(article1.articles_published || new Date(0))
            .split("/")
            .reverse()
            .join("/"),
          displayImages: Boolean(article1.articles_displayImages),
          text: null,
          articleType: null,
          authors,
          parentCategory: category,
          categories: null,
          similarArticles: null,
        };
      }),
    );

    const response: IAuthorArticles = { pages, articles };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (err) {
    console.error("Error in author articles:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
