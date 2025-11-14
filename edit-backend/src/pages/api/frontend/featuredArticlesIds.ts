import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import type { NextApiRequest, NextApiResponse } from "next";
import { IFeaturedHome } from "@/lib/types";
import { featuredHome } from "@prisma/client";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

async function getLatestFeaturedHome() {
  return prisma.featuredHome.findFirst({
    orderBy: { featuredHome_timestamp: "desc" },
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

  try {
    const data = await cache<featuredHome | null>(
      "featuredHome:latest",
      7200,
      getLatestFeaturedHome,
    );

    if (!data) {
      res.status(404).json({ message: "No featuredHome found with this id" });
      return;
    }

    const featuredHome: IFeaturedHome = {
      id: data.featuredHome_id,
      articles: data.featuredHome_articles,
      timestamp: data.featuredHome_timestamp,
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
