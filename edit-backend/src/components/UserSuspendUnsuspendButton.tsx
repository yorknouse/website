"use client";

import ConfirmAction from "@/components/ConfirmAction";
import { suspendUser, unsuspendUser } from "@/lib/users";
import { ReactNode } from "react";

export default function UserSuspendUnsuspendButton({
  children,
  props: { suspendUnsuspend, userToID, userName, userID, userActions },
}: {
  children: ReactNode;
  props: {
    suspendUnsuspend: "suspend" | "unsuspend";
    userToID: number;
    userName: string;
    userID: number;
    userActions?: Map<number, boolean>;
  };
}) {
  const handleSuspendUnsuspend = async (id?: number) => {
    if (!id) return;
    switch (suspendUnsuspend) {
      case "unsuspend":
        await unsuspendUser(id, userID, userActions);
        break;
      case "suspend":
        await suspendUser(id, userID, userActions);
        break;
    }
    window.location.reload();
  };

  return (
    <ConfirmAction
      title={`${suspendUnsuspend == "suspend" ? "Suspend" : "Unsuspend"} User`}
      message={`Are you sure you want to ${suspendUnsuspend} "${userName}"?`}
      onConfirm={handleSuspendUnsuspend}
      confirmData={userToID}
    >
      {children}
    </ConfirmAction>
  );
}
