import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { ParseForm } from "@/lib/parseForm";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const { fields } = await ParseForm(req);
    const articleIdRaw = Array.isArray(fields.articleId)
      ? fields.articleId[0]
      : fields.articleId;

    if (!articleIdRaw) {
      return res.status(400).json({ message: "Missing articleId" });
    }

    // Remove all non-digit characters
    const sanitisedId = articleIdRaw.replace(/\D/g, "");

    // Ensure it's actually a valid positive integer
    const articleId = Number(sanitisedId);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      return res.status(400).json({ message: "Invalid articleId" });
    }

    const result = await prisma.articlesReads.create({
      data: { articles_id: Number(sanitisedId) },
    });

    if (!result) {
      res.status(500).json({ message: "Insert failed" });
    }

    res.status(204).end();
  } catch (err) {
    console.error("Error in registerRead:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
