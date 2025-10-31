import { z } from "zod";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { checkUserPermissions, GetUserData } from "@/lib/auth";

export const metadata: Metadata = {
  title: "User articles",
};

export default async function UserArticles({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(30, userData.actions)) {
    return {};
  }

  const resolvedParams = await params;
  const userIDParse = z
    .preprocess((val) => (val ? val : undefined), z.coerce.number())
    .safeParse(resolvedParams.userId);

  if (!userIDParse.success) {
    return <>Invalid User ID</>;
  }

  const user = await prisma.users.findFirst({
    where: {
      users_userid: userIDParse.data,
    },
  });

  if (!user) {
    return <>Invalid User ID</>;
  }

  return (
    <div>
      <p>{user.users_userid}</p>
      <p>
        {user.users_name1} {user.users_name2}
      </p>
    </div>
  );
}
