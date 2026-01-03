import prisma from "@/lib/prisma";
import { IFeaturedHome } from "@/lib/types";
import { cache } from "@/lib/cache";
import { NextResponse } from "next/server";
import { featuredHome } from "@prisma/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function getLatestFeaturedHome() {
  return prisma.featuredHome.findFirst({
    orderBy: { featuredHome_timestamp: "desc" },
  });
}

export async function GET(_: Request) {
  try {
    const data = await cache<featuredHome | null>(
      "featuredHome:latest",
      7200,
      getLatestFeaturedHome,
    );

    if (!data) {
      return NextResponse.json(
        { message: "Featured home not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    const featuredHome: IFeaturedHome = {
      id: data.featuredHome_id,
      articles: data.featuredHome_articles,
      timestamp: data.featuredHome_timestamp,
    };

    return NextResponse.json(featuredHome, {
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
