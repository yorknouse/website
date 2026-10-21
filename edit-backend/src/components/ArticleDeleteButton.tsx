"use client";

import ConfirmAction from "@/components/ConfirmAction";
import { ReactNode } from "react";

export default function ArticleDeleteButton({
  children,
  props: { articleID, headline },
}: {
  children: ReactNode;
  props: {
    articleID: number;
    headline: string;
  };
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
    window.location.reload();
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
