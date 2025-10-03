import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { ParseForm } from "@/lib/parseForm";
import type { IEdition } from "@/lib/types";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
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

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const { fields } = await ParseForm(req);
    const slug = String(fields.slug);
    const isPreview = String(fields.isPreview) == "true";

    if (!slug || slug.length == 0) {
      res.status(400).json({ message: "Missing or invalid slug" });
      return;
    }

    const edition: IEdition | null = await prisma.editions.findFirst({
      where: {
        editions_slug: slug,
        editions_show: !isPreview,
        editions_deleted: false,
        NOT: {
          editions_thumbnail: null,
        },
      },
      orderBy: {
        editions_published: "desc",
      },
    });

    if (!edition) {
      res.status(404).json({ message: "Failed to find edition" });
    }

    res.status(200).json(edition);
  } catch (err) {
    console.error("Error in getEditions:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
