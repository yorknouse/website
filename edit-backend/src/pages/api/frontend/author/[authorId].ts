import type { NextApiRequest, NextApiResponse } from "next";
import he from "he";
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
    if (!authorId) {
      return res.status(400).json({ message: "Missing authorId" });
    }

    const id = Number(authorId);

    if (!Number.isInteger(id) || id < 0) {
      return res.status(400).json({ message: "Invalid authorId" });
    }

    const author = await prisma.users.findFirst({
      where: {
        users_userid: id,
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

    // Decode all HTML entities before sending back
    const decodedAuthor = {
      ...author,
      users_name1: he.decode(author.users_name1 || ""),
      users_name2: he.decode(author.users_name2 || ""),
    };

    res.status(200).json(decodedAuthor);
  } catch (err) {
    console.error("Error in author:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
