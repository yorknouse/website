import prisma from "@/lib/prisma";
import { IEdition } from "@/lib/types";
import { NextResponse } from "next/server";
import { cache } from "@/lib/cache";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

async function getEditions() {
  return prisma.editions.findMany({
    where: {
      editions_show: true,
      editions_deleted: false,
      NOT: {
        editions_thumbnail: null,
      },
    },
    orderBy: {
      editions_published: "desc",
    },
  });
}

export async function GET(_: Request) {
  try {
    const editions: IEdition[] = await cache(
      "editions:latest",
      7200,
      getEditions,
    );

    if (!editions || editions.length == 0) {
      return NextResponse.json(
        { message: "Editions not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(editions, corsRes);
  } catch (err) {
    console.error("Error in editions", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
