import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getArticleImage } from "@/lib/articles";
import he from "he";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";

export const runtime = "nodejs";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

function toBooleanSearch(term: string) {
  return term
    .trim()
    .split(/\s+/)
    .map((w) => `+${w}*`)
    .join(" ");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawTerm = formData.get("searchterm");

    if (!rawTerm || typeof rawTerm !== "string") {
      return NextResponse.json(
        { message: "Missing searchterm" },
        { status: 400 },
      );
    }

    const term = sanitiseSearchTerm(rawTerm);
    if (!term) {
      return NextResponse.json(
        { message: "Invalid searchterm" },
        { status: 400 },
      );
    }

    const term1 = `%${rawTerm}%`;

    const matchingAuthors = await prisma.users.findMany({
      where: {
        users_deleted: false,
        OR: [
          { users_name1: { search: term1 } },
          { users_name2: { search: term1 } },
          {
            AND: [
              { users_name1: { not: null } },
              { users_name2: { not: null } },
              {
                AND: [
                  { users_name1: { search: term.split(" ")[0] } },
                  { users_name2: { search: term.split(" ")[1] || "" } },
                ],
              },
            ],
          },
        ],
      },
      select: { users_userid: true },
    });

    const authorIds =
      matchingAuthors.length > 0
        ? matchingAuthors.map((a) => a.users_userid)
        : [-1];

    const authorsArticlesIds = (
      await prisma.articlesAuthors.findMany({
        where: {
          users_userid: { in: authorIds },
        },
        select: { articles_id: true },
      })
    ).map((a) => a.articles_id);

    const articleIdsFromText = await prisma.$queryRaw<
      { articles_id: number }[]
    >`
  SELECT DISTINCT ad.articles_id
  FROM articlesDrafts ad
  JOIN articles a ON a.articles_id = ad.articles_id
  WHERE (a.articles_showInSearch = true
    AND a.articles_published <= NOW()
    AND MATCH(ad.articlesDrafts_headline, ad.articlesDrafts_excerpt)
        AGAINST (${toBooleanSearch(rawTerm)} IN BOOLEAN MODE))
`;

    const mergedArticleIds = [
      ...new Set([
        ...articleIdsFromText.map((a) => a.articles_id),
        ...authorsArticlesIds,
      ]),
    ];

    if (mergedArticleIds.length === 0) {
      return NextResponse.json({ result: true, response: [] }, corsRes);
    }

    const articlesNew = await prisma.articles.findMany({
      where: {
        articles_id: { in: mergedArticleIds },
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
      articlesNew.map(async (article) => {
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
          url: `/${article.articles_published
            ?.toISOString()
            .split("T")[0]
            .replace(/-/g, "/")}/${String(article.articles_slug)}`,
          image,
          articles_authors: article.users.map((aa) => ({
            users_name1: he.decode(aa.users.users_name1 || ""),
            users_name2: he.decode(aa.users.users_name2 || ""),
            users_userid: aa.users.users_userid,
          })),
          ...(category && {
            categories_name: category.categories_name,
            categories_displayName: category.categories_displayName,
            categories_backgroundColor: category.categories_backgroundColor,
          }),
        };
      }),
    );

    return NextResponse.json({ result: true, response: results }, corsRes);
  } catch (err) {
    console.error("Search suggestions error:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
