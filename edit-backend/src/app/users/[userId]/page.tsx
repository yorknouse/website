import type { Metadata } from "next";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { s3URL } from "@/lib/s3URL";
import AvatarUploader from "@/components/AvatarUploader";

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

  return (
    <div>
      <p>{user.users_userid}</p>
      <p>{user.users_name1}</p>
      <p>{user.users_name2}</p>
      <p>{user.users_pronouns}</p>
      <p>{user.users_googleAppsUsernameYork}</p>
      <p>{user.users_googleAppsUsernameNouse}</p>
      <p>{user.users_bio}</p>
      <a
        href={`https://nouse.co.uk/author/${user.users_userid}`}
        target={"_blank"}
      >
        https://nouse.co.uk/author/{user.users_userid}
      </a>
      {thumbnailURL && (
        <Image
          src={thumbnailURL}
          alt={"User thumbnail"}
          width={400}
          height={400}
        />
      )}
      <p>{user.users_social_facebook}</p>
      <p>{user.users_social_twitter}</p>
      <p>{user.users_social_instagram}</p>
      <p>{user.users_social_linkedin}</p>
      <p>{user.users_social_snapchat}</p>
      <AvatarUploader
        userId={user.users_userid}
        backendUrl={"http://localhost:419"}
      />
    </div>
  );
}
