import he from "he";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

type RouteParams = {
  params: Promise<{
    authorId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { authorId } = await params;

  try {
    if (!authorId) {
      return NextResponse.json(
        { message: "Missing authorId" },
        { status: 400 },
      );
    }

    const id = Number(authorId);

    if (!Number.isInteger(id) || id < 0) {
      return NextResponse.json(
        { message: "Invalid authorId" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { message: "Missing or invalid authorId" },
        { status: 404 },
      );
    }

    // Decode all HTML entities before sending back
    const decodedAuthor = {
      ...author,
      users_name1: he.decode(author.users_name1 || ""),
      users_name2: he.decode(author.users_name2 || ""),
    };

    return NextResponse.json(decodedAuthor, corsRes);
  } catch (err) {
    console.error("Error in author:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
