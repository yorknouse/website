import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import type { IEdition } from "@/lib/types";

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

  const latestEdition: IEdition | null = await prisma.editions.findFirst({
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

  res.status(200).json(latestEdition);
}
