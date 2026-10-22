/** Mirrors the slug generation in html/admin/article.twig. */
export function slugify(headline: string): string {
  return headline
    .split(" ")
    .join("-")
    .replace(/[^a-zA-Z0-9\-_.]/g, "")
    .toLowerCase()
    .replace(/\./g, "");
}

const SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function randomSlugSuffix(): string {
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }
  return out;
}
