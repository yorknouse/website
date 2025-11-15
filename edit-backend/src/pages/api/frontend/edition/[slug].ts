import { NextApiRequest, NextApiResponse } from "next";
import { validatePreviewToken } from "@/lib/preview";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";
import type { IEdition } from "@/lib/types";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import crypto from "crypto";

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

  const { slug } = req.query;

  const authHeader = req.headers.authorization;
  const hashHeader = req.headers["x-preview-hash"];
  const validToken = validatePreviewToken(authHeader);

  const isPreview =
    hashHeader !== undefined && typeof hashHeader === "string" && validToken;

  const slugSanitised = sanitiseSearchTerm(slug);

  const cleanSlug = decodeURIComponent(slugSanitised || "");

  try {
    const edition = await cache<IEdition | null>(
      `edition:slug:${cleanSlug}`,
      2592000,
      () =>
        prisma.editions.findFirst({
          where: {
            editions_slug: cleanSlug,
            editions_show: !isPreview,
            editions_deleted: false,
            NOT: {
              editions_thumbnail: null,
            },
          },
          orderBy: {
            editions_published: "desc",
          },
        }),
    );

    if (!edition) {
      res.status(404).json({ message: "Edition not found" });
      return;
    }

    if (isPreview) {
      const expectedHash = crypto
        .createHash("md5")
        .update(edition.editions_id.toString())
        .digest("hex");
      if (expectedHash !== hashHeader) {
        res.status(404).json({ message: "Edition not found" });
        return;
      }
    }

    res.status(200).json(edition);
  } catch (err) {
    console.error("Error in getEditions:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
