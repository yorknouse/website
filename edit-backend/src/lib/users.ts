"use server";

import prisma from "@/lib/prisma";
import { checkUserPermissions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";

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
  let whereClause: Prisma.Sql | null = null;

  if (search && search.trim().length > 0) {
    const rawTerms = search.trim().split(/\s+/);

    const safeTerms = rawTerms
      .map((t) => sanitiseSearchTerm(t))
      .filter((t): t is string => t !== null);

    if (safeTerms.length > 0) {
      const termClauses = safeTerms.map(
        (term) =>
          Prisma.sql`
        (
          u.users_name1 LIKE CONCAT('%', ${term}, '%')
          OR u.users_name2 LIKE CONCAT('%', ${term}, '%')
          OR u.users_googleAppsUsernameYork LIKE CONCAT('%', ${term}, '%')
          OR u.users_googleAppsUsernameNouse LIKE CONCAT('%', ${term}, '%')
          OR u.users_userid = ${isNaN(Number(term)) ? -1 : Number(term)}
          OR EXISTS (
            SELECT 1
            FROM userPositions up2
            LEFT JOIN positions p2
              ON p2.positions_id = up2.positions_id
            WHERE up2.users_userid = u.users_userid
              AND (
                up2.userPositions_displayName LIKE CONCAT('%', ${term}, '%')
                OR p2.positions_displayName LIKE CONCAT('%', ${term}, '%')
              )
          )
        )
      `,
      );

      whereClause = Prisma.sql`
      WHERE ${Prisma.join(termClauses, ` AND `)} AND u.users_deleted IS FALSE
    `;
    }
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
             IF(COUNT(up.userPositions_id) = 0, NULL, JSON_ARRAYAGG(
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
                                                      )) AS userPositions

      FROM users u
             LEFT JOIN userPositions up
                       ON up.users_userid = u.users_userid
                         AND up.userPositions_start <= NOW()
                         AND (up.userPositions_end >= NOW() OR up.userPositions_end IS NULL)
             LEFT JOIN positions p
                       ON p.positions_id = up.positions_id
        ${whereClause ?? Prisma.sql`WHERE u.users_deleted IS FALSE`}

      GROUP BY
        u.users_userid,
        u.users_name1,
        u.users_name2,
        u.users_created

      ORDER BY
        (
        SELECT COUNT(DISTINCT up3.users_userid)
        FROM userPositions up3
        WHERE up3.users_userid = u.users_userid
        AND up3.userPositions_start <= NOW()
        AND (up3.userPositions_end > NOW() OR up3.userPositions_end IS NULL)
        )
      DESC,
        u.users_name1,
        u.users_name2,
        u.users_created
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
    `,
    prisma.$queryRaw<{ total: number }[]>`
    SELECT COUNT(DISTINCT u.users_userid) AS total
    FROM users u
    LEFT JOIN userPositions up
      ON up.users_userid = u.users_userid
     AND up.userPositions_start <= NOW()
     AND (up.userPositions_end >= NOW() OR up.userPositions_end IS NULL)
    LEFT JOIN positions p
      ON p.positions_id = up.positions_id

    ${whereClause ?? Prisma.sql`WHERE u.users_deleted IS FALSE`}
  `,
  ]);

  if (totalCount.length !== 1 || isNaN(Number(totalCount[0].total)))
    throw new Error("Total count for users error");

  return {
    users: users,
    pagination: {
      page,
      totalPages: Math.ceil(Number(totalCount[0].total) / pageSize),
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
