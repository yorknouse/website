"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getAuditLog({
  search,
  userId,
  actionUserId,
  page = 1,
  pageSize = 50,
}: {
  search?: string;
  userId?: number;
  actionUserId?: number;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.auditLogWhereInput = {};
  if (search && search.length > 0) {
    where.OR = [
      {
        auditLog_actionType: {
          contains: search,
        },
      },
      {
        auditLog_actionTable: {
          contains: search,
        },
      },
      {
        auditLog_actionData: {
          contains: search,
        },
      },
    ];
  }

  if (userId && userId !== 0) {
    where.users_auditLog_users_useridTousers = { users_userid: userId };
  }

  if (actionUserId && actionUserId !== 0) {
    where.users_auditLog_auditLog_actionUseridTousers = {
      users_userid: actionUserId,
    };
  }

  const [auditLog, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        auditLog_id: "desc",
      },
      include: {
        users_auditLog_users_useridTousers: {
          select: {
            users_userid: true,
            users_name1: true,
            users_name2: true,
          },
        },
        users_auditLog_auditLog_actionUseridTousers: {
          select: {
            users_userid: true,
            users_name1: true,
            users_name2: true,
          },
        },
      },
    }),
    prisma.auditLog.count(),
  ]);

  return {
    auditLog: auditLog,
    pagination: {
      page,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}
