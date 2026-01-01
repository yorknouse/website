import { z } from "zod";

// Only allow basic letters, numbers, spaces, and common punctuation
export const searchTermSchema = z.preprocess(
  (val) => (Array.isArray(val) ? val[0] : val),
  z
    .string()
    .trim()
    .min(1, "Search term cannot be empty")
    .max(250, "Search term too long")
    .regex(/^[\p{L}\p{N}\s.,_\-]+$/u, "Invalid characters in search term"),
);

export function sanitiseSearchTerm(input: unknown) {
  const parsed = searchTermSchema.safeParse(input);
  if (!parsed.success) return null;
  return parsed.data.normalize("NFKC");
}
