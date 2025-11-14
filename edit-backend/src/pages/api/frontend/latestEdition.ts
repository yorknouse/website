import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { IEditionLatest, IEditionLimited } from "@/lib/types";
import { s3URL } from "@/lib/s3URL";
import { cache } from "@/lib/cache";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  cors(res);

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const data = await cache<IEditionLimited | null>(
    "latestEdition:latest",
    7200,
    getLatestEdition,
  );

  if (!data) {
    res.status(404).json({ message: "Latest edition not Found" });
    return;
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

  res.status(200).json(latestEditionRet);
}
