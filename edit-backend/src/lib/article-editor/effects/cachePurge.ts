/**
 * Purges the readers site caches for an article, its editions and categories.
 * Returns false if the purge failed. Placeholder until Task 6 lands.
 */
export async function purgeCaches(t: {
  articleUrl?: string;
  slug?: string;
  editionIds: number[];
  categoryIds: number[];
}): Promise<boolean> {
  void t;
  return true;
}
