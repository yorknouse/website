import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

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
    const { fileId, size } = req.query;

    if (!fileId || typeof fileId === "undefined") {
      res.status(400).json({ message: "Missing or invalid fileId" });
      return;
    }

    let sizeExt = "_comp";

    const sizeString = String(size);

    if (sizeString == "tiny") sizeExt = "_tiny";
    else if (sizeString == "small") sizeExt = "_small";
    else if (sizeString == "medium") sizeExt = "_medium";
    else if (sizeString == "large") sizeExt = "_large";

    const sanitisedId = String(fileId).replace(/\D/g, "");

    const s3File = await prisma.s3files.findUnique({
      where: {
        s3files_id: Number(sanitisedId),
      },
    });

    if (!s3File) {
      res.status(400).json({ message: "Missing or invalid fileId" });
      return;
    }

    let fileUrl = `${s3File.s3files_cdn_endpoint}/${
      s3File.s3files_path
    }/${encodeURIComponent(s3File.s3files_filename)}`;

    if (size) {
      fileUrl += sizeExt;
    }

    fileUrl += `.${s3File.s3files_extension}`;

    res.status(200).json({ url: fileUrl });
  } catch (err) {
    console.error("Error in s3URL:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
