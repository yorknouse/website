import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

// Disable Next.js body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
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
    const categoriesColours: {
      categories_name: string;
      categories_backgroundColor: string | null;
    }[] = await prisma.categories.findMany({
      select: {
        categories_backgroundColor: true,
        categories_name: true,
      },
      where: {
        NOT: {
          categories_backgroundColor: null,
        },
      },
    });

    if (!categoriesColours) {
      res.status(404).json({ message: "Failed to find categories colours" });
    }

    res.status(200).json(categoriesColours);
  } catch (err) {
    console.error("Error in categoriesColours:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
