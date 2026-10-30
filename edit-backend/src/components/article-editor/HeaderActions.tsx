"use client";

import { useRouter } from "next/navigation";
import ArticleDeleteButton from "@/components/ArticleDeleteButton";
import ArticlePreviewButton from "@/components/ArticlePreviewButton";

export interface HeaderActionsProps {
  articleId: number;
  /** The saved headline, for the delete confirmation. */
  headline: string;
  showInSearch: boolean;
  showInAdmin: boolean;
  publishedUtc: string;
  /** Readers' site and Grafana URLs, built by the page from server env vars. */
  links?: { site: string; stats: string };
  /** Permission 33. */
  canDelete: boolean;
  /** Clears the unsaved-changes guard before leaving the page. */
  onDeleted: () => void;
}

const LINK_CLASS =
  "rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 transition";

export default function HeaderActions({
  articleId,
  headline,
  showInSearch,
  showInAdmin,
  publishedUtc,
  links,
  canDelete,
  onDeleted,
}: HeaderActionsProps) {
  const router = useRouter();
  const published = publishedUtc ? new Date(publishedUtc) : null;
  const live =
    showInSearch && published !== null && published < new Date() && links;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {live ? (
        <>
          <a
            href={links.site}
            target="_blank"
            rel="noreferrer"
            className={LINK_CLASS}
          >
            View on site
          </a>
          <a
            href={links.stats}
            target="_blank"
            rel="noreferrer"
            className={LINK_CLASS}
          >
            Stats
          </a>
        </>
      ) : (
        <ArticlePreviewButton props={{ articleID: articleId }} />
      )}
      {canDelete && showInAdmin && (
        <ArticleDeleteButton
          props={{ articleID: articleId, headline }}
          onDeleted={() => {
            onDeleted();
            router.push("/articles");
          }}
        >
          <button
            type="button"
            className="cursor-pointer rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 transition"
          >
            Delete
          </button>
        </ArticleDeleteButton>
      )}
    </div>
  );
}
