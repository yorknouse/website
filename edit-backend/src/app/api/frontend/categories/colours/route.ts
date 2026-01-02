import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { NextResponse } from "next/server";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

async function getCategoryColours() {
  return prisma.categories.findMany({
    select: {
      categories_backgroundColor: true,
      categories_name: true,
    },
    where: {
      NOT: {
        categories_backgroundColor: null,
      },
    },
  });
}

export async function GET(_: Request) {
  try {
    const data = await cache<
      {
        categories_name: string;
        categories_backgroundColor: string | null;
      }[]
    >("categoryColours:latest", 7200, getCategoryColours);

    if (!data) {
      return NextResponse.json({ message: "Unable to find categories colours" }, { status: 404 });
    }

    return NextResponse.json(data, corsRes);
  } catch (err) {
    console.error("Error in categories featured and count:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
