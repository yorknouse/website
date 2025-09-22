import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { IFeaturedHome } from "@/lib/types";
import { featuredHome } from "@prisma/client";

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
    const featuredArticlesIds: featuredHome | null =
      await prisma.featuredHome.findFirst({
        orderBy: {
          featuredHome_timestamp: "desc",
        },
      });

    if (!featuredArticlesIds) {
      res.status(404).json({ message: "No featuredHome found with this id" });
      return;
    }

    const featuredHome: IFeaturedHome = {
      id: featuredArticlesIds.featuredHome_id,
      articles: featuredArticlesIds.featuredHome_articles,
      timestamp: featuredArticlesIds.featuredHome_timestamp,
    };

    res.status(200).json(featuredHome);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      result: false,
      error: { code: "SERVER_ERROR", message: "Unexpected error" },
    });
  }
}
