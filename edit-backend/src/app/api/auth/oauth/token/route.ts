import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { CLIENTS } from "@/app/api/backend/oauth/clients";

export async function POST(req: NextRequest) {
  const form = await req.formData();

  if (form.get("grant_type") !== "authorization_code") {
    return new NextResponse(null, { status: 400 });
  }

  const code = form.get("code") as string;
  const client_id = form.get("client_id") as string;
  const client_secret = form.get("client_secret") as string;

  const client = CLIENTS[client_id as keyof typeof CLIENTS];
  if (!client || client.secret !== client_secret) {
    return new NextResponse("Auth error", { status: 401 });
  }

  const authCode = await prisma.usersOauthCodes.findFirst({
    where: {
      usersOauthCodes_code: code,
      usersOauthCodes_client: client_id,
      usersOauthCodes_valid: 1,
      usersOauthCodes_type: "authorise_token",
      usersOauthCodes_expiry: { gte: new Date() },
    },
  });

  if (!authCode) {
    return new NextResponse("Auth error", { status: 401 });
  }

  await prisma.usersOauthCodes.update({
    where: { usersOauthCodes_id: authCode.usersOauthCodes_id },
    data: { usersOauthCodes_valid: 0 },
  });

  const accessToken = `oauthaccesstoken_${crypto.randomUUID()}`;

  await prisma.usersOauthCodes.create({
    data: {
      usersOauthCodes_code: accessToken,
      usersOauthCodes_client: client_id,
      usersOauthCodes_valid: 1,
      usersOauthCodes_type: "access_token",
      users_userid: authCode.users_userid,
      usersOauthCodes_expiry: new Date(Date.now() + 3600),
    },
  });

  const user = await prisma.users.findUnique({
    where: { users_userid: authCode.users_userid },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 500 });
  }

  let email: string = "";

  if (user.users_googleAppsUsernameNouse)
    email = user.users_googleAppsUsernameNouse + "@nouse.co.uk";
  else if (user.users_googleAppsUsernameYork)
    email = user.users_googleAppsUsernameYork + "@york.ac.uk";
  else return new NextResponse("User email not valid", { status: 500 });

  const jwtPayload: any = {
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: email,
    name: `${user.users_name1} ${user.users_name2}`,
  };

  if (client_id === "GRAFANA") {
    jwtPayload.role = "Viewer";
  }

  const id_token = jwt.sign(jwtPayload, accessToken, {
    algorithm: "HS512",
  });

  return NextResponse.json({
    expires_in: 3600,
    access_token: accessToken,
    token_type: "Bearer",
    id_token,
  });
}
