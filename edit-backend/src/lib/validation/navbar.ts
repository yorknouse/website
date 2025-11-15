import { z } from "zod";
import { parseCategories, parseSubMenuCategories } from "./categories";

export const mobileNavBarSchema = z.object({
  active: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().min(1),
  ),
  style: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.enum(["muse", "nouse"]),
  ),
  menuCategories: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().transform(parseCategories),
  ),
  subMenuCategories: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().transform(parseSubMenuCategories),
  ),
});

export const desktopNavBarSchema = z.object({
  active: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().min(1),
  ),
  menuCategories: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().transform(parseCategories),
  ),
  subMenuCategories: z.preprocess(
    (val) => (Array.isArray(val) ? val[0] : val),
    z.string().transform(parseSubMenuCategories),
  ),
});

export function validateMobileNavBar(fields: unknown) {
  const result = mobileNavBarSchema.safeParse(fields);
  if (!result.success) {
    console.error(
      "[validateMobileNavBar] Validation failed:",
      JSON.stringify(z.treeifyError(result.error), null, 2),
      "\nRaw input:",
      JSON.stringify(fields, null, 2),
    );

    throw new Error("Invalid mobileNavBar input");
  }
  return result.data;
}

export function validateDesktopNavBar(fields: unknown) {
  const result = desktopNavBarSchema.safeParse(fields);
  if (!result.success) {
    console.error(
      "[validateMobileNavBar] Validation failed:",
      JSON.stringify(z.treeifyError(result.error), null, 2),
      "\nRaw input:",
      JSON.stringify(fields, null, 2),
    );

    throw new Error("Invalid desktopNavBar input");
  }
  return result.data;
}

export type MobileNavBarInput = z.infer<typeof mobileNavBarSchema>;
export type DesktopNavBarInput = z.infer<typeof desktopNavBarSchema>;
