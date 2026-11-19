import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiErrors";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import { isSlugTaken } from "@/lib/article-editor/service";
import { randomSlugSuffix, slugify } from "@/lib/article-editor/slug";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await GetUserData();
  if (!user) return apiError("UNAUTHENTICATED", "You're not logged in");
  if (!checkUserPermissions(31, user.actions)) {
    return apiError(
      "FORBIDDEN",
      "You don't have permission to create articles",
    );
  }

  const headline = new URL(req.url).searchParams.get("headline") ?? "";
  let slug = slugify(headline);
  try {
    if (slug && (await isSlugTaken(slug))) {
      slug = `${slug}-${randomSlugSuffix()}`;
    }
  } catch (err) {
    console.error("Error checking slug:", err);
    return apiError("SERVER_ERROR", "Something went wrong on the server");
  }
  return NextResponse.json({ slug });
}
