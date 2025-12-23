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
    prisma.users.findMany({
      where,
      orderBy: [
        {
          userPositions: {
            _count: "desc",
          },
        },
        {
          users_name1: "asc",
        },
        {
          users_name2: "asc",
        },
        {
          users_created: "asc",
        },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        userPositions: {
          where: {
            userPositions_start: {
              lte: new Date(),
            },
            userPositions_end: {
              gte: new Date(),
            },
          },
        },
      },
    }),
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
