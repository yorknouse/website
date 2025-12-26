"use server";

import prisma from "@/lib/prisma";
import { checkUserPermissions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function getUser(userId: number) {
  if (isNaN(userId)) {
    return null;
  }
  return prisma.users.findFirst({
    where: {
      users_userid: userId,
    },
  });
}

export async function getUsers({
  search,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.usersWhereInput = { users_deleted: false };

  if (search && search.trim().length > 0) {
    const terms = search.trim().split(/\s+/);
    where.AND = terms.map((term) => ({
      OR: [
        { users_name1: { contains: term } },
        { users_name2: { contains: term } },
        { users_googleAppsUsernameYork: { contains: term } },
        { users_googleAppsUsernameNouse: { contains: term } },
        { users_userid: isNaN(Number(term)) ? undefined : Number(term) },
        {
          userPositions: {
            some: {
              OR: [
                { userPositions_displayName: { contains: term } },
                {
                  positions: {
                    positions_displayName: { contains: term },
                  },
                },
              ],
            },
          },
        },
      ].filter(Boolean),
    }));
  }

  const [users, totalCount] = await Promise.all([
    prisma.$queryRaw<
      [
        {
          users_userid: number;
          users_name1: string | null;
          users_name2: string | null;
          users_googleAppsUsernameYork: string | null;
          users_googleAppsUsernameNouse: string | null;
          users_created: Date | null;
          users_suspended: Boolean;
          users_deleted: Boolean | null;
          userPositions: [
            {
              userPositions_id: number;
              userPositions_start: Date;
              userPositions_end: Date | null;
              positions: {
                positions_id: number;
                positions_displayName: string;
                positions_rank: number;
              };
            },
          ];
        },
      ]
    >`
      SELECT u.*,
             COALESCE(
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'userPositions_id', up.userPositions_id,
                         'userPositions_start', up.userPositions_start,
                         'userPositions_end', up.userPositions_end,
                         'positions', JSON_OBJECT(
                                      'positions_id', p.positions_id,
                                      'positions_displayName', p.positions_displayName,
                                      'positions_rank', p.positions_rank
                                      )
                     )
                 ),
                 JSON_ARRAY()
             ) AS userPositions
      FROM users u
             LEFT JOIN userPositions up
                       ON up.users_userid = u.users_userid
                         AND up.userPositions_start <= NOW()
                         AND up.userPositions_end >= NOW()
             LEFT JOIN positions p
                       ON p.positions_id = up.positions_id
      GROUP BY u.users_userid, u.users_name1, u.users_name2, u.users_created
      ORDER BY (SELECT COUNT(DISTINCT users_userid)
                FROM userPositions
                WHERE users_userid = u.users_userid
                  AND userPositions_end >= NOW()
                  AND userPositions_start <= NOW()) DESC, u.users_name1, u.users_name2, u.users_created
  LIMIT ${pageSize}
  OFFSET ${(page - 1) * pageSize}
`,
    prisma.users.count({ where }),
  ]);

  return {
    users: users,
    pagination: {
      page,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

export async function suspendUser(
  userToID: number,
  userID: number,
  userActions?: Map<number, boolean>,
) {
  // TODO: move audit log to separate function

  if (!checkUserPermissions(9, userActions)) {
    return {};
  }

  await prisma.auditLog.create({
    data: {
      auditLog_actionType: "UPDATE",
      auditLog_actionTable: "users",
      auditLog_actionData: "SUSPEND 1",
      users_userid: userID,
      auditLog_actionUserid: userToID,
    },
  });

  const user = await prisma.users.findUnique({
    where: { users_userid: userToID },
  });

  if (!user) throw new Error("User not found");

  await prisma.users.update({
    where: { users_userid: userToID },
    data: {
      users_suspended: true,
    },
  });

  return { success: true };
}

export async function unsuspendUser(
  userToID: number,
  userID: number,
  userActions?: Map<number, boolean>,
) {
  // TODO: move audit log to separate function

  if (!checkUserPermissions(9, userActions)) {
    return {};
  }

  await prisma.auditLog.create({
    data: {
      auditLog_actionType: "UPDATE",
      auditLog_actionTable: "users",
      auditLog_actionData: "SUSPEND 0",
      users_userid: userID,
      auditLog_actionUserid: userToID,
    },
  });

  const user = await prisma.users.findUnique({
    where: { users_userid: userToID },
  });

  if (!user) throw new Error("User not found");

  await prisma.users.update({
    where: { users_userid: userToID },
    data: {
      users_suspended: false,
    },
  });

  return { success: true };
}

export async function endAllPositionsForUser(
  userToID: number,
  userID: number,
  userActions?: Map<number, boolean>,
) {
  // TODO: move audit log to separate function

  if (!checkUserPermissions(13, userActions)) {
    return {};
  }

  await prisma.auditLog.create({
    data: {
      auditLog_actionType: "ENDALL",
      auditLog_actionTable: "userPositions",
      users_userid: userID,
      auditLog_actionUserid: userToID,
    },
  });

  const user = await prisma.users.findUnique({
    where: { users_userid: userToID },
  });

  if (!user) throw new Error("User not found");

  await prisma.userPositions.updateMany({
    where: {
      users_userid: userToID,
      OR: [
        {
          userPositions_end: {
            gte: new Date(),
          },
        },
        {
          userPositions_end: null,
        },
      ],
    },
    data: {
      userPositions_end: new Date(),
    },
  });

  return { success: true };
}

export async function deleteUser(
  userToID: number,
  userID: number,
  userActions?: Map<number, boolean>,
) {
  // TODO: move audit log to separate function

  if (!checkUserPermissions(15, userActions)) {
    return {};
  }

  await prisma.auditLog.create({
    data: {
      auditLog_actionType: "UPDATE",
      auditLog_actionTable: "users",
      auditLog_actionData: "DELETE USER",
      users_userid: userID,
      auditLog_actionUserid: userToID,
    },
  });

  // Fetch user info
  const user = await prisma.users.findUnique({
    where: { users_userid: userToID },
  });

  if (!user) throw new Error("User not found");

  // Soft delete
  await prisma.users.update({
    where: { users_userid: userToID },
    data: {
      users_deleted: true,
    },
  });

  return { success: true };
}
