import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { NextResponse } from "next/server";
import { ICategory } from "@/lib/types";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

function getCategoriesUnder(id: number) {
  return async () => {
    return prisma.categories.findMany({
      where: {
        categories_showMenu: true,
        categories_showPublic: true,
        categories_nestUnder: id,
      },
    });
  };
}

type RouteParams = {
  params: Promise<{
    nestUnder: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { nestUnder } = await params;

  try {
    if (!nestUnder || typeof nestUnder === "undefined") {
      return NextResponse.json({ message: "Missing style" }, { status: 400 });
    }

    const id = Number(nestUnder);

    if (!Number.isInteger(id) || id < 0) {
      return NextResponse.json(
        { message: "Invalid nestUnder" },
        { status: 400 },
      );
    }

    const data = await cache<ICategory[]>(
      `categories:nestUnder:${id}`,
      7200,
      getCategoriesUnder(id),
    );

    if (!data || data.length === 0) {
      return NextResponse.json({ message: "Subcategories not found" }, { status: 404 });
    }

    return NextResponse.json(data, corsRes);
  } catch (err) {
    console.error("Error in menu categories:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
