"use client";

import ConfirmAction from "@/components/ConfirmAction";
import { deleteArticle } from "@/lib/articles";
import { ReactNode } from "react";

export default function ArticleDeleteButton({
  children,
  props: { articleID, headline, userID },
}: {
  children: ReactNode;
  props: { articleID: number; headline: string; userID: number };
}) {
  const handleDelete = async (id?: number) => {
    if (!id) return;
    await deleteArticle(id, userID);
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
