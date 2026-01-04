import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { GetUserData, checkUserPermissions } from "@/lib/auth";
import { CLIENTS } from "@/app/api/backend/oauth/clients";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userData = await GetUserData();
  if (!userData) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get("client_id");
  const redirect_uri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");

  if (!client_id || !redirect_uri || !scope || !state) {
    return new NextResponse("Error - missing parameters", { status: 400 });
  }

  const client = CLIENTS[client_id as keyof typeof CLIENTS];
  if (!client) {
    return new NextResponse("Service not found", { status: 400 });
  }

  if (
    client.permission &&
    !checkUserPermissions(client.permission, userData.actions)
  ) {
    return new NextResponse("Sorry - you can't access this service", {
      status: 403,
    });
  }

  const code = `oauthtoken_${crypto.randomUUID()}`;

  await prisma.usersOauthCodes.create({
    data: {
      usersOauthCodes_code: code,
      usersOauthCodes_client: client_id,
      usersOauthCodes_valid: 1,
      usersOauthCodes_type: "authorise_token",
      users_userid: userData.id,
      usersOauthCodes_expiry: new Date(Date.now() + 3600000),
    },
  });

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/oauth/authorise?code=${code}&redirectUri=${redirect_uri}&state=${state}&client=${client.name}`,
  );
}
