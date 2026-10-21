import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/apiErrors";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import { decodeText } from "@/lib/article-editor/content";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await GetUserData();
  if (!user) return apiError("UNAUTHENTICATED", "You're not logged in");
  if (!checkUserPermissions(32, user.actions)) {
    return apiError("FORBIDDEN", "You don't have permission to edit articles");
  }

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json([]);

  try {
    const rows = await prisma.users.findMany({
      where: {
        users_deleted: false,
        OR: [
          { users_name1: { contains: q } },
          { users_name2: { contains: q } },
        ],
      },
      select: { users_userid: true, users_name1: true, users_name2: true },
      orderBy: [{ users_name1: "asc" }, { users_name2: "asc" }],
      take: 20,
    });
    return NextResponse.json(
      rows.map((u) => ({
        id: u.users_userid,
        name: `${decodeText(u.users_name1)} ${decodeText(u.users_name2)}`.trim(),
      })),
    );
  } catch (err) {
    console.error("Error searching users:", err);
    return apiError("SERVER_ERROR", "Something went wrong on the server");
  }
}
