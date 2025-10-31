import { NextRequestWithAuth, withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const origin = req.headers.get("origin");
    const allowedOrigins = ["https://edit.nouse.co.uk"];

    // Handle CORS preflight requests immediately
    if (req.method === "OPTIONS") {
      const res = NextResponse.next();
      if (origin && allowedOrigins.includes(origin)) {
        res.headers.set("Access-Control-Allow-Origin", origin);
        res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.headers.set("Access-Control-Allow-Headers", "*");
      }
      return new NextResponse(null, { status: 204, headers: res.headers });
    }

    const token = req.nextauth?.token;

    // No token at all → let withAuth redirect to signIn
    if (!token?.internalToken) return NextResponse.next();

    // 1️⃣ Check DB for a valid token entry
    const dbToken = await prisma.authTokens.findFirst({
      where: {
        authTokens_token: token.internalToken,
        authTokens_valid: true,
      },
      select: {
        authTokens_created: true,
        authTokens_ipAddress: true,
      },
    });

    if (!dbToken) {
      // Token invalid or revoked
      console.warn("Middleware: invalid or missing token");
      return NextResponse.redirect(
        new URL("/auth/error?reason=invalid_token", req.url),
      );
    }

    // 2️⃣ (Optional) Expiry check: e.g. 12 hours from creation
    const createdAt = new Date(dbToken.authTokens_created);
    const expiresAt = new Date(createdAt.getTime() + 12 * 60 * 60 * 1000); // 12 hours
    if (new Date() > expiresAt) {
      console.warn("Middleware: token expired");
      return NextResponse.redirect(
        new URL("/auth/error?reason=expired_token", req.url),
      );
    }

    // 3️⃣ (Optional) IP consistency check
    const requestIp =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (
      dbToken.authTokens_ipAddress &&
      requestIp &&
      dbToken.authTokens_ipAddress !== requestIp
    ) {
      console.warn("Middleware: IP mismatch", {
        stored: dbToken.authTokens_ipAddress,
        current: requestIp,
      });
      return NextResponse.redirect(
        new URL("/auth/error?reason=ip_mismatch", req.url),
      );
    }

    await prisma.authTokens.updateMany({
      where: { authTokens_token: token.internalToken },
      data: { authTokens_created: new Date() },
    });

    // Everything OK — continue
    const res = NextResponse.next();
    // Add CORS headers for normal requests
    if (origin && allowedOrigins.includes(origin)) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "*");
    }

    return res;
  },
  {
    pages: {
      signIn: "/auth/signin", // Redirect here if not logged in
    },
  },
);

export const config = {
  matcher: [
    // Protect all routes except the sign-in and auth routes
    "/((?!api/auth|api/s3url|api/frontend|auth/signin|_next|favicon.ico|images|public|oldAssets).*)",
  ],
};
