import { AuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { s3URL } from "@/lib/s3URL";

export async function IsLoggedIn() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function GetUserData(): Promise<{
  id: number;
  name: string;
  email: string;
  photo: string | null;
  positions: (string | null)[];
  actions: Map<number, boolean> | undefined;
} | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const positionGroupsList = await prisma.positionsGroups.findMany();
  const positionGroupsMap = new Map<number, number[]>();
  positionGroupsList.map((positionGroup) => {
    if (positionGroup.positionsGroups_actions) {
      const actions: number[] = [];
      positionGroup.positionsGroups_actions
        .split(",")
        .forEach((posGroupAction) => {
          actions.push(Number(posGroupAction));
        });
      positionGroupsMap.set(positionGroup.positionsGroups_id, actions);
    }
  });

  const userRecord = await prisma.users.findFirst({
    where: {
      users_userid: Number(session.user.internalId),
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
        include: {
          positions: true,
        },
      },
    },
  });

  if (!userRecord) {
    return null;
  }

  const userActionsMap = new Map<number, boolean>();
  userRecord.userPositions.map((position) => {
    if (position.positions && position.positions.positions_positionsGroups) {
      position.positions.positions_positionsGroups
        .split(",")
        .forEach((positionGroup) => {
          positionGroupsMap.get(Number(positionGroup))?.map((action) => {
            userActionsMap.set(action, true);
          });
        });
    }
  });

  let thumbnail: string | null = null;
  if (userRecord.users_thumbnail !== null) {
    thumbnail = await s3URL(Number(userRecord.users_thumbnail), "tiny");
  }

  return {
    id: Number(session.user.internalId),
    name: userRecord.users_name1 + " " + userRecord.users_name2,
    email:
      userRecord.users_googleAppsUsernameNouse !== null
        ? userRecord.users_googleAppsUsernameNouse + "@nouse.co.uk"
        : userRecord.users_googleAppsUsernameYork + "@york.ac.uk",
    photo: thumbnail,
    positions: userRecord.userPositions.map(
      (pos) =>
        pos.positions?.positions_displayName || pos.userPositions_displayName,
    ),
    actions: userActionsMap,
  };
}

export async function GetUserName(): Promise<string | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const userRecord = await prisma.users.findFirst({
    select: {
      users_name1: true,
      users_name2: true,
    },
    where: {
      users_userid: Number(session.user.internalId),
    },
  });

  if (!userRecord) {
    return null;
  }

  return userRecord.users_name1 + " " + userRecord.users_name2;
}

export function checkUserPermissions(
  permissionNumber: number,
  userActions?: Map<number, boolean>,
): boolean {
  if (!userActions) {
    return false;
  }
  return userActions.get(permissionNumber) ?? false;
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
        console.warn(`Blocked login: unauthorised domain ${domain}`);
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
            include: {
              positions: true,
            },
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

      const positionGroupsList = await prisma.positionsGroups.findMany();
      const positionGroupsMap = new Map<number, number[]>();
      positionGroupsList.map((positionGroup) => {
        if (positionGroup.positionsGroups_actions) {
          const actions: number[] = [];
          positionGroup.positionsGroups_actions
            .split(",")
            .forEach((posGroupAction) => {
              actions.push(Number(posGroupAction));
            });
          positionGroupsMap.set(positionGroup.positionsGroups_id, actions);
        }
      });

      const userActionsMap = new Map<number, boolean>();
      userRecord.userPositions.map((position) => {
        if (
          position.positions &&
          position.positions.positions_positionsGroups
        ) {
          position.positions.positions_positionsGroups
            .split(",")
            .forEach((positionGroup) => {
              positionGroupsMap.get(Number(positionGroup))?.map((action) => {
                userActionsMap.set(action, true);
              });
            });
        }
      });

      // Attach to session
      user.internalId = userRecord.users_userid;
      user.internalToken = tokenValue;

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.internalId = user.internalId;
      }

      if (account && profile) {
        token.id = profile.sub;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          internalId: token.internalId,
        };
      }

      return session;
    },
  },
};
