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

  const { nestUnder } = req.query;

  try {
    if (!nestUnder || typeof nestUnder === "undefined") {
      res.status(400).json({ message: "Missing or invalid nestUnder" });
      return;
    }

    const sanitisedId = String(nestUnder).replace(/\D/g, "");

    const categories = await prisma.categories.findMany({
      where: {
        categories_showMenu: true,
        categories_showPublic: true,
        categories_nestUnder: Number(sanitisedId),
      },
    });

    if (!categories || categories.length === 0) {
      res.status(404).json({ message: "Subcategories not found" });
      return;
    }

    res.status(200).json(categories);
  } catch (err) {
    console.error("Error in menuSubcategories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
