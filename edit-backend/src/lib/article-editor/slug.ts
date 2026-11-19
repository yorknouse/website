export const MAX_SLUG_LENGTH = 255;

const SUFFIX_LENGTH = 5;
const SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Mirrors the slug generation in html/admin/article.twig, then shortens it so
 * the slug, plus a "-xxxxx" suffix if it's taken, fits MAX_SLUG_LENGTH.
 */
export function slugify(headline: string): string {
  return headline
    .split(" ")
    .join("-")
    .replace(/[^a-zA-Z0-9\-_.]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .slice(0, MAX_SLUG_LENGTH - SUFFIX_LENGTH - 1)
    .replace(/-+$/, "");
}

export function randomSlugSuffix(): string {
  let out = "";
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    out += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }
  return out;
}
