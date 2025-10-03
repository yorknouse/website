import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

const cors = (res: NextApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
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

  const { authorId } = req.query;

  try {
    if (!authorId || typeof authorId === "undefined") {
      res.status(400).json({ message: "Missing or invalid authorId" });
      return;
    }

    const sanitisedId = String(authorId).replace(/\D/g, "");

    const author = await prisma.users.findFirst({
      where: {
        users_userid: Number(sanitisedId),
        users_deleted: false,
      },
      include: {
        userPositions: {
          orderBy: {
            userPositions_end: "desc",
          },
          include: {
            positions: true,
          },
        },
      },
    });

    if (!author) {
      res.status(404).json({ message: "Missing or invalid authorId" });
      return;
    }

    res.status(200).json(author);
  } catch (err) {
    console.error("Error in author:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
