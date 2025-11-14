import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";

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

async function getCategoryColours() {
  return prisma.categories.findMany({
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
    const data = await cache<
      {
        categories_name: string;
        categories_backgroundColor: string | null;
      }[]
    >("categoryColours:latest", 7200, getCategoryColours);

    if (!data) {
      res.status(404).json({ message: "Failed to find categories colours" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error in categoriesColours:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
