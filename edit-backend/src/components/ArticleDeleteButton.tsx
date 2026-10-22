"use client";

import ConfirmAction from "@/components/ConfirmAction";
import { ReactNode } from "react";

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
