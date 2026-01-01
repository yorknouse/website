import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { userId } = await params;

  try {
    if (!userId) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    const id = Number(userId);

    if (!Number.isInteger(id) || id < 0) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
    }

    const user = await prisma.users.findFirst({
      where: {
        users_userid: id,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Missing or invalid userId" },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("Error in user:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
