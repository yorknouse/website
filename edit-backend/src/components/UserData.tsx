"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function UserData() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div><span>Loading...</span></div>
    }

    if (!session) {
        redirect("/auth/signin");
    }

    return (
        <div className="flex items-center gap-2">
            <span>{session.user?.name}</span>
            <span>{session.user?.email}</span>
        </div>
    )
}