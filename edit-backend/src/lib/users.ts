import prisma from "@/lib/prisma";

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
