import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { IEditionLatest, IEditionLimited } from "@/lib/types";
import { s3URL } from "@/lib/s3URL";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  cors(res);

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const latestEdition: IEditionLimited | null = await prisma.editions.findFirst({
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

  if (!latestEdition) {
    res.status(404).json({ message: "Latest edition not Found" });
    return;
  }

  let s3url = await s3URL(Number(latestEdition.editions_thumbnail), "large");

  const latestEditionRet: IEditionLatest = {
      name: latestEdition.editions_name,
      slug: latestEdition.editions_slug,
      thumbnailURL: s3url,
  }

  res.status(200).json(latestEditionRet);
}
