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

  const { name } = req.query;

  try {
    if (!name || typeof name === "undefined") {
      res.status(400).json({ message: "Missing or invalid categoryName" });
      return;
    }

    const categoryFeaturedAndCount: {
      _count: {
        articles: number;
      };
      categories_featured: string | null;
    } | null = await prisma.categories.findFirst({
      where: {
        categories_name: String(name),
        categories_showPublic: true,
        categories_showMenu: true,
      },
      select: {
        categories_featured: true,
        _count: {
          select: {
            articles: {
              where: {
                article: {
                  articles_showInLists: true,
                },
              },
            },
          },
        },
      },
    });

    if (
      !categoryFeaturedAndCount ||
      categoryFeaturedAndCount._count.articles === 0
    ) {
      res.status(404).json({ message: "Categories featured not found" });
      return;
    }

    res.status(200).json(categoryFeaturedAndCount);
  } catch (err) {
    console.error("Error in menuCategories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
