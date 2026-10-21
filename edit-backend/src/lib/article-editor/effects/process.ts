/**
 * Runs the after-save side effects (social posting, York SU notification,
 * cache purge) for an article and returns warning strings for any that failed.
 * Placeholder until Task 6 lands.
 */
export async function processArticle(
  articleId: number,
  opts?: {
    purge?: { previousEditionId: number | null; previousCategoryIds: number[] };
  },
): Promise<string[]> {
  void articleId;
  void opts;
  return [];
}
