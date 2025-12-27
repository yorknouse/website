"use client";

import ConfirmAction from "@/components/ConfirmAction";
import { deleteUser } from "@/lib/users";
import { ReactNode } from "react";

export default function UserDeleteButton({
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
  const handleDelete = async (id?: number) => {
    if (!id) return;
    await deleteUser(id, userID, userActions);
    window.location.reload();
  };

  return (
    <ConfirmAction
      title="Delete User"
      message={`Are you sure you want to delete "${userName}"? This cannot be undone.`}
      onConfirm={handleDelete}
      confirmData={userToID}
    >
      {children}
    </ConfirmAction>
  );
}
