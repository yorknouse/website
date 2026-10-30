"use client";

import type { MouseEvent } from "react";
import type { PendingConfirm } from "./useArticleForm";

const TONE = {
  danger: "bg-red-500 hover:bg-red-600 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
};

/** A controlled version of the ConfirmAction modal, for prompts raised mid-save. */
export default function ConfirmDialog({
  confirm,
}: {
  confirm: PendingConfirm;
}) {
  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) confirm.answer(false);
  };

  return (
    <div
      onClick={onBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-confirm-title"
        className="animate-fadeIn w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
      >
        <h2
          id="article-confirm-title"
          className="mb-2 text-lg font-semibold text-gray-800"
        >
          {confirm.title ?? "Before you save"}
        </h2>
        {confirm.paragraphs.map((p) => (
          <p key={p} className="mb-4 text-gray-600">
            {p}
          </p>
        ))}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            autoFocus
            onClick={() => confirm.answer(false)}
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => confirm.answer(true)}
            className={`rounded-md px-4 py-2 transition ${TONE[confirm.tone]}`}
          >
            {confirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
