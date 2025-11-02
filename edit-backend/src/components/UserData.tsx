"use client";

import Image from "next/image";

export default function UserData({
  props: { userData },
}: {
  props: {
    userData: {
      id: number;
      name: string;
      email: string;
      photo: string | null;
      positions: (string | null)[];
      actions: Map<number, boolean> | undefined;
    };
  };
}) {
  if (userData === null) {
    return (
      <div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span>{userData.id}</span>
      <span>{userData.name}</span>
      <span>{userData.email}</span>
      <Image
        src={userData.photo || "/favicon.svg"}
        alt={"User profile image"}
        width={32}
        height={32}
        className={"rounded-lg"}
      />
      {userData.positions.map((position) => (
        <span key={position}>Position - {position}</span>
      ))}
    </div>
  );
}
