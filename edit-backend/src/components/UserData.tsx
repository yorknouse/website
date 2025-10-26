"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Image from "next/image";

export default function UserData() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div>
        <span>Loading...</span>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex items-center gap-2">
      <span>{session.user?.internalId}</span>
      <span>{session.user?.name}</span>
      <span>{session.user?.email}</span>
      <Image
        src={session.user?.image!}
        alt={"User profile image"}
        width={32}
        height={32}
        className={"rounded-lg"}
      />
      {session.user.positions?.map((position) => (<span>Position - {position}</span>))}
    </div>
  );
}
