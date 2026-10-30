"use client";

import ConfirmAction from "@/components/ConfirmAction";
import { ReactNode } from "react";

const LOGGED_OUT =
  "You've been logged out. Log in again in a new tab, then try again.";

export default function ArticleDeleteButton({
  children,
  props: { articleID, headline },
  onDeleted,
}: {
  children: ReactNode;
  props: {
    articleID: number;
    headline: string;
  };
  /** Runs after a successful delete; the page reloads when it's omitted. */
  onDeleted?: () => void;
}) {
  const handleDelete = async (id?: number) => {
    if (!id) return;
    const res = await fetch(`/api/backend/articles/${id}`, {
      method: "DELETE",
    });
    const isJson = (res.headers.get("content-type") ?? "").includes(
      "application/json",
    );
    // An expired session is redirected to the sign-in page, which fetch follows.
    if ((res.redirected || !isJson) && res.status < 500) {
      alert(LOGGED_OUT);
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      alert(body?.message ?? "Something went wrong while deleting");
      return;
    }
    if (onDeleted) onDeleted();
    else window.location.reload();
  };

  return (
    <ConfirmAction
      title="Delete Article"
      message={`Are you sure you want to delete "${headline}"? This cannot be undone.`}
      onConfirm={handleDelete}
      confirmData={articleID}
    >
      {children}
    </ConfirmAction>
  );
}
