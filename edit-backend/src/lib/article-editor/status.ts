export type ArticleStatus = "draft" | "search" | "published";

export function statusToFlags(s: ArticleStatus): {
  articles_showInLists: boolean;
  articles_showInSearch: boolean;
  articles_showInAdmin: true;
} {
  return {
    articles_showInLists: s === "published",
    articles_showInSearch: s === "published" || s === "search",
    articles_showInAdmin: true,
  };
}

export function flagsToStatus(a: {
  articles_showInLists: boolean;
  articles_showInSearch: boolean;
}): ArticleStatus {
  if (a.articles_showInLists && a.articles_showInSearch) return "published";
  if (a.articles_showInSearch) return "search";
  return "draft";
}
