import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { IEdition } from "@/lib/types";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
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

  try {
    const editions: IEdition[] = await prisma.editions.findMany({
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

    if (!editions || editions.length == 0) {
      res.status(404).json({ message: "Failed to find editions" });
    }

    res.status(200).json(editions);
  } catch (err) {
    console.error("Error in editions:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
