"use client";

export default function ArticlePreviewButton({
  props: { articleID },
}: {
  props: {
    articleID: number;
  };
}) {
  return (
    <a
      href={`/api/backend/articles/${articleID}/preview`}
      target="_blank"
      className={
        "px-3 py-1 rounded bg-blue-600 text-white btn btn-sm btn-default cursor-pointer"
      }
    >
      Preview on Site
    </a>
  );
}
