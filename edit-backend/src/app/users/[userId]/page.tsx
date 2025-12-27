import type { Metadata } from "next";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { s3URL } from "@/lib/s3URL";
import UserPage from "@/components/UserPage";

export const metadata: Metadata = {
  title: "User",
};

export default async function User({
  params,
}: {
  params: Promise<{
    userId: string;
  }>;
}) {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(32, userData.actions)) {
    return <p>Unauthorised</p>;
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
    return <>Failed to fetch user data.</>;
  }

  let thumbnailURL: string | null = null;

  if (user.users_thumbnail) {
    thumbnailURL = await s3URL(Number(user.users_thumbnail));
  }

  return <UserPage props={{ user, initialThumbnailURL: thumbnailURL }} />;
}
