import dateFormatter from "@/lib/dateFormatter";

/** The article on the readers' site: `{FRONTEND_URL}articles/YYYY/MM/DD/{slug}`. */
export function articleSiteUrl(published: Date, slug: string | null): string {
  // DD/MM/YYYY -> YYYY/MM/DD
  const date = dateFormatter.format(published).split("/").reverse().join("/");
  return `${process.env.FRONTEND_URL}articles/${date}/${String(slug)}`;
}

/** The article's Grafana stats dashboard. */
export function articleStatsUrl(articleId: number, published: Date): string {
  return `${process.env.GRAFANA_URL}d/article/article-stats?var-articleid=${articleId}&from=${(published.valueOf() - 7200) * 1000}&to=now`;
}
