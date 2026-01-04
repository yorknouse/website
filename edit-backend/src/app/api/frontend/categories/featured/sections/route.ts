import prisma from "@/lib/prisma";
import { ICategory } from "@/lib/types";
import { cache } from "@/lib/cache";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function getParentCategories() {
  return prisma.categories.findMany({
    where: {
      categories_showHome: true,
      categories_showPublic: true,
      categories_nestUnder: null,
      NOT: {
        categories_name: "muse",
      },
      categories_featured: {
        not: null,
      },
    },
  });
}

export async function GET(_: Request) {
  try {
    const data = await cache<ICategory[]>(
      "parentCategories:latest",
      7200,
      getParentCategories,
    );
    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "Featured categories not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(data, {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Error in featured sections:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
