import type { IArticleFull } from "@components/types.ts";

export const getArticles = async (
  style: "nouse" | "muse",
  articleIds?: number[],
): Promise<IArticleFull[]> => {
  if (articleIds == undefined) {
    return [];
  }

  const apiBase = import.meta.env.PUBLIC_API_BASE_URL;

  const articlesString = JSON.stringify(articleIds);

  const formData = new FormData();
  formData.append("articleIds", articlesString);
  formData.append("style", style);

  const res = await fetch(`${apiBase}/api/frontend/getArticles`, {
    method: "POST",
    body: formData,
  });
  return await res.json();
};
