"use client";

import ConfirmAction from "@/components/ConfirmAction";
import { endAllPositionsForUser } from "@/lib/users";
import { ReactNode } from "react";

export default function UserEndAllPositionsButton({
  children,
  props: { userToID, userName, userID, userActions },
}: {
  children: ReactNode;
  props: {
    userToID: number;
    userName: string;
    userID: number;
    userActions?: Map<number, boolean>;
  };
}) {
  const handleEndAllRoles = async (id?: number) => {
    if (!id) return;
    await endAllPositionsForUser(id, userID, userActions);
    window.location.reload();
  };

  return (
    <ConfirmAction
      title="End all Positions now"
      message={`Are you sure you want to end all positions now for "${userName}"? This cannot be undone.`}
      onConfirm={handleEndAllRoles}
      confirmData={userToID}
    >
      {children}
    </ConfirmAction>
  );
}
