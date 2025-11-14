import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import { ICategory } from "@/lib/types";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

function getCategoriesUnder(id: number) {
  return async () => {
    return prisma.categories.findMany({
      where: {
        categories_showMenu: true,
        categories_showPublic: true,
        categories_nestUnder: id,
      },
    });
  };
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

  const { nestUnder } = req.query;

  try {
    if (!nestUnder) {
      return res.status(400).json({ message: "Missing nestUnder" });
    }

    const id = Number(nestUnder);

    if (!Number.isInteger(id) || id < 0) {
      return res.status(400).json({ message: "Invalid nestUnder" });
    }

    const data = await cache<ICategory[]>(
      `categories:nestUnder:${id}`,
      7200,
      getCategoriesUnder(id),
    );

    if (!data || data.length === 0) {
      res.status(404).json({ message: "Subcategories not found" });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error in menuSubcategories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
