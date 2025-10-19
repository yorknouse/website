import type { NextApiRequest, NextApiResponse } from "next";
import { s3URL } from "@/lib/s3URL";

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

    let sizeExt: false | "tiny" | "small" | "medium" | "large" | "comp" = "comp";

    const sizeString = String(size);

    if (sizeString == "tiny") sizeExt = "tiny";
    else if (sizeString == "small") sizeExt = "small";
    else if (sizeString == "medium") sizeExt = "medium";
    else if (sizeString == "large") sizeExt = "large";

    const sanitisedId = Number(String(fileId).replace(/\D/g, ""));

    const url = await s3URL(sanitisedId, sizeExt)

    res.status(200).json({ url: url });
  } catch (err) {
    console.error("Error in s3URL:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
