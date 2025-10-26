import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
// Client usage must include the next-auth/react signOut() function still

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.internalToken) {
      return NextResponse.json(
        { success: false, message: "No session token found" },
        { status: 401 },
      );
    }

    // 1️⃣ Mark authToken as invalid
    await prisma.authTokens.updateMany({
      where: { authTokens_token: token.internalToken },
      data: { authTokens_valid: false },
    });

    // 2️⃣ Return a success response
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { success: false, message: "Logout failed" },
      { status: 500 },
    );
  }
}
