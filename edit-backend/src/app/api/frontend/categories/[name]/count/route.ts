import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";
import { NextResponse } from "next/server";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

type RouteParams = {
  params: Promise<{
    name: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
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

    const categoryCount = await cache<{
      _count: {
        articles: number;
      };
    } | null>(`categoryCount:name:${nameSanitised}`, 7200, () =>
      prisma.categories.findFirst({
        where: {
          categories_name: nameSanitised,
          categories_showPublic: true,
          categories_showMenu: true,
        },
        select: {
          _count: {
            select: {
              articles: {
                where: {
                  article: {
                    articles_showInLists: true,
                  },
                },
              },
            },
          },
        },
      }),
    );

    if (!categoryCount || categoryCount._count.articles === 0) {
      return NextResponse.json(
        { message: "Categories count not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(categoryCount, corsRes);
  } catch (err) {
    console.error("Error in categories count:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
