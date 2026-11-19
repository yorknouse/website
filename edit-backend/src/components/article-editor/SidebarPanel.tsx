"use client";

import { ReactNode, useState } from "react";

export type PanelId =
  | "publishing"
  | "taxonomy"
  | "thumbnail"
  | "edition"
  | "style"
  | "social"
  | "versions";

/** Which sidebar panel holds each save field, so errors can open it. */
export const FIELD_TO_PANEL: Record<string, PanelId> = {
  status: "publishing",
  published: "publishing",
  slug: "publishing",
  categoryIds: "taxonomy",
  authorIds: "taxonomy",
  thumbnailId: "thumbnail",
  thumbnailCredit: "thumbnail",
  editionId: "edition",
  editionPage: "edition",
  dropCap: "style",
  displayImages: "style",
  thumbnailPortrait: "style",
  postToFacebook: "social",
  postToTwitter: "social",
  socialExcerpt: "social",
};

export interface SidebarPanelProps {
  id: PanelId;
  title: string;
  defaultOpen?: boolean;
  /** Keeps the panel open, e.g. while one of its fields has an error. */
  forceOpen?: boolean;
  children: ReactNode;
}

export default function SidebarPanel({
  id,
  title,
  defaultOpen = false,
  forceOpen = false,
  children,
}: SidebarPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Stays open once forced, so fixing the error doesn't snap the panel shut.
  if (forceOpen && !open) setOpen(true);

  const bodyId = `panel-${id}`;
  return (
    <section className="rounded-md border border-gray-200 bg-white">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-gray-800"
        >
          {title}
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </h2>
      {open && (
        <div id={bodyId} className="space-y-3 border-t border-gray-200 p-4">
          {children}
        </div>
      )}
    </section>
  );
}
