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
    const articleId = fields.articleId;

    if (!articleId || typeof articleId === "undefined") {
      res.status(400).json({ message: "Missing or invalid articleId" });
      return;
    }

    const sanitisedId = articleId[0].replace(/\D/g, "");

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
