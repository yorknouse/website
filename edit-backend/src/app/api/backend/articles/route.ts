import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiErrors";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import {
  articleSaveSchema,
  zodToFieldErrors,
} from "@/lib/article-editor/schema";
import { createArticle } from "@/lib/article-editor/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await GetUserData();
  if (!user) return apiError("UNAUTHENTICATED", "You're not logged in");
  if (!checkUserPermissions(31, user.actions)) {
    return apiError(
      "FORBIDDEN",
      "You don't have permission to create articles",
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid request");
  }

  const parsed = articleSaveSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Some fields need fixing", 400, {
      fieldErrors: zodToFieldErrors(parsed.error),
    });
  }

  try {
    const result = await createArticle(parsed.data, user.id);
    if (!result.ok) {
      return apiError(result.code, result.message, undefined, {
        fieldErrors: result.fieldErrors,
        suggestedSlug: result.suggestedSlug,
      });
    }
    const { articleId, draftId, warnings } = result;
    return NextResponse.json({ articleId, draftId, warnings }, { status: 201 });
  } catch (err) {
    console.error("Error creating article:", err);
    return apiError(
      "SERVER_ERROR",
      "Something went wrong on the server while saving",
    );
  }
}
