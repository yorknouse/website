import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

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

  try {
    const categories = await prisma.categories.findMany({
      where: {
        categories_showHome: true,
        categories_showPublic: true,
        categories_nestUnder: null,
        NOT: {
          categories_name: "muse",
        },
        categories_featured: {
          not: null,
        },
      },
    });
    if (!categories || categories.length === 0) {
      res.status(400).json({ message: "Featured categories not found" });
      return;
    }

    res.status(200).json(categories);
  } catch (err) {
    console.error("Error in featuredSectionCategories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
