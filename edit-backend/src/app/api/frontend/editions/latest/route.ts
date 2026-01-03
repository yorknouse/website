import prisma from "@/lib/prisma";
import { IEditionLatest, IEditionLimited } from "@/lib/types";
import { NextResponse } from "next/server";
import { cache } from "@/lib/cache";
import { s3URL } from "@/lib/s3URL";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

async function getLatestEdition() {
  return prisma.editions.findFirst({
    select: {
      editions_name: true,
      editions_slug: true,
      editions_thumbnail: true,
    },
    orderBy: {
      editions_published: "desc",
    },
    where: {
      editions_show: true,
      editions_showHome: true,
      editions_deleted: false,
      NOT: {
        editions_thumbnail: null,
      },
    },
  });
}

export async function GET(_: Request) {
  try {
    const data = await cache<IEditionLimited | null>(
      "latestEdition:latest",
      7200,
      getLatestEdition,
    );

    if (!data) {
      return NextResponse.json(
        { message: "Latest edition not found" },
        { status: 404 },
      );
    }

    const s3url = await cache<string>(
      `s3URL:${Number(data.editions_thumbnail)}-large`,
      2592000, // 30 days for urls as they will not change
      () => s3URL(Number(data.editions_thumbnail), "large"),
    );

    const latestEditionRet: IEditionLatest = {
      name: data.editions_name,
      slug: data.editions_slug,
      thumbnailURL: s3url,
    };

    return NextResponse.json(latestEditionRet, corsRes);
  } catch (err) {
    console.error("Error in latest editions", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
