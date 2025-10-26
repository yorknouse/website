import { AuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

export async function IsLoggedIn() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function GetUserData() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  return {
    id: session.user.internalId,
    name: session.user.name,
    email: session.user.email,
    photo: session.user.image,
  };
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!profile?.email) return false;

      const email = profile.email.toLowerCase();
      const domain = email.split("@")[1];
      const allowedDomains = ["york.ac.uk", "nouse.co.uk"];

      // 1️⃣ Restrict domain access
      if (!allowedDomains.includes(domain)) {
        console.warn(`Blocked login: unauthorized domain ${domain}`);
        return false;
      }

      // 2️⃣ Map email to username column
      const usernameFromEmail = email.replace(`@${domain}`, "");

      const userRecord = await prisma.users.findFirst({
        where:
          domain === "york.ac.uk"
            ? {
                users_googleAppsUsernameYork: usernameFromEmail,
                users_deleted: false,
              }
            : {
                users_googleAppsUsernameNouse: usernameFromEmail,
                users_deleted: false,
              },
        include: {
          userPositions: {
            where: {
              userPositions_start: { lte: new Date() },
              OR: [
                { userPositions_end: null },
                { userPositions_end: { gte: new Date() } },
              ],
            },
            include: { positions: true },
          },
        },
      });

      // 3️⃣ Authorization checks
      if (!userRecord) {
        console.warn("User not found:", email);
        return false;
      }

      if (userRecord.users_suspended) {
        console.warn("Suspended user:", email);
        return false;
      }

      if (!userRecord.userPositions || userRecord.userPositions.length === 0) {
        console.warn("User has no active positions:", email);
        return false;
      }

      // 4️⃣ (Optional) Create an internal auth token like legacy PHP
      const tokenValue = createHash("md5")
        .update(Date.now() + randomBytes(16).toString("hex"))
        .digest("hex");

      await prisma.authTokens.create({
        data: {
          authTokens_created: new Date(),
          authTokens_token: tokenValue,
          users_userid: userRecord.users_userid,
          authTokens_valid: true,
          authTokens_ipAddress: "", // can be filled using a middleware
        },
      });

      // Attach to session
      user.internalId = userRecord.users_userid;
      user.internalToken = tokenValue;
      user.positions = userRecord.userPositions.map(
        (pos) =>
          pos.positions?.positions_displayName || pos.userPositions_displayName,
      );

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.internalId = user.internalId;
        token.positions = user.positions;
      }

      if (account && profile) {
        token.id = profile.sub;
        token.name = profile.name;
        token.email = profile.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          name: token.name,
          email: token.email,
          image: token.picture,
          internalId: token.internalId,
          positions: token.positions,
        };
      }

      return session;
    },
  },
};
