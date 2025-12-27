import { z } from "zod";

// Mirrors your ICategory interface
export const categorySchema = z.object({
  categories_id: z.number().int().nonnegative(),
  categories_showHome: z.boolean(),
  categories_displayName: z.string().nullable(),
  categories_showMenu: z.boolean(),
  categories_name: z.string().min(1),
  categories_showPublic: z.boolean(),
  categories_showAdmin: z.boolean(),
  categories_featured: z.string().nullable(),
  categories_order: z.number().int().nonnegative().nullable(),
  categories_nestUnder: z.number().int().nullable(),
  categories_showSub: z.boolean(),
  categories_facebook: z.string().nullable(),
  categories_twitter: z.string().nullable(),
  categories_instagram: z.string().nullable(),
  categories_backgroundColor: z.string().nullable(),
  categories_backgroundColorContrast: z.string().nullable(),
  categories_customTheme: z.string().nullable(),
  categories_socialMediaOverlay: z.string().nullable(),
});

/**
 * Validates and parses JSON stringified array of categories.
 */
export function parseCategories(json: unknown) {
  try {
    // If it's an array (from ParseForm), take first element
    let val = Array.isArray(json) ? json[0] : json;

    // If it is still a string, parse JSON
    if (typeof val === "string") {
      val = JSON.parse(val);
    }

    // Now val should be an array of objects
    const result = z.array(categorySchema).safeParse(val);
    if (!result.success) throw new Error("Invalid category array structure");
    return result.data;
  } catch (err) {
    console.error("[parseCategories] Failed:", err, "Raw input:", json);
    throw new Error("Malformed category JSON");
  }
}

/**
 * Validates and parses JSON stringified array of [string, ICategory[]] pairs into a Map.
 */
export function parseSubMenuCategories(json: unknown) {
  try {
    let val = Array.isArray(json) ? json[0] : json;

    if (typeof val === "string") {
      val = JSON.parse(val);
    }

    const pairSchema = z.tuple([z.string(), z.array(categorySchema)]);
    const result = z.array(pairSchema).safeParse(val);
    if (!result.success) throw new Error("Invalid subMenuCategories structure");
    return new Map(result.data);
  } catch (err) {
    console.error("[parseSubMenuCategories] Failed:", err, "Raw input:", json);
    throw new Error("Malformed subMenuCategories JSON");
  }
}

// Export inferred TS type (so it's shared everywhere)
export type ICategoryValidated = z.infer<typeof categorySchema>;
