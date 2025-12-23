"use client";

import { useState, Dispatch, SetStateAction } from "react";
import Prisma from "@prisma/client";
import Image from "next/image";
import AvatarUploader from "@/components/AvatarUploader";

function updateThumbnailFunc(
  id: number,
  setThumbnailURL: Dispatch<SetStateAction<string | null>>,
) {
  return async () => {
    const res = await fetch(`/api/backend/users/${id}`);
    const updatedUser = await res.json();
    if (updatedUser?.users_thumbnail) {
      const newURLRes = await fetch(
        `/api/s3url?size=false&fileId=${updatedUser.users_thumbnail}`,
      );
      const newURL = await newURLRes.json();
      if (!newURL) {
        alert("Setting new thumbnail failed");
      }
      setThumbnailURL(newURL.url);
    }
  };
}

export default function UserPage({
  props: { user, initialThumbnailURL },
}: {
  props: {
    user: Prisma.users;
    initialThumbnailURL: string | null;
  };
}) {
  const [thumbnailURL, setThumbnailURL] = useState<string | null>(
    initialThumbnailURL,
  );

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
        onSuccess={updateThumbnailFunc(user.users_userid, setThumbnailURL)}
      />
    </div>
  );
}
