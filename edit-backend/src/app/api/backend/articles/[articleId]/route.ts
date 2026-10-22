import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiErrors";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import {
  articleSaveSchema,
  zodToFieldErrors,
} from "@/lib/article-editor/schema";
import { softDeleteArticle, updateArticle } from "@/lib/article-editor/service";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ articleId: string }>;
};

function parseId(articleId: string): number | null {
  if (!/^\d+$/.test(articleId)) return null;
  const id = Number(articleId);
  return Number.isSafeInteger(id) ? id : null;
}

export async function PUT(req: Request, { params }: RouteParams) {
  const user = await GetUserData();
  if (!user) return apiError("UNAUTHENTICATED", "You're not logged in");
  if (!checkUserPermissions(32, user.actions)) {
    return apiError("FORBIDDEN", "You don't have permission to edit articles");
  }

  const id = parseId((await params).articleId);
  if (id === null) return apiError("NOT_FOUND", "Article not found");

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
    const result = await updateArticle(id, parsed.data, user.id);
    if (!result.ok) {
      return apiError(result.code, result.message, undefined, {
        fieldErrors: result.fieldErrors,
        suggestedSlug: result.suggestedSlug,
      });
    }
    const { articleId, draftId, warnings } = result;
    return NextResponse.json({ articleId, draftId, warnings });
  } catch (err) {
    console.error("Error updating article:", err);
    return apiError(
      "SERVER_ERROR",
      "Something went wrong on the server while saving",
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const user = await GetUserData();
  if (!user) return apiError("UNAUTHENTICATED", "You're not logged in");
  if (!checkUserPermissions(33, user.actions)) {
    return apiError(
      "FORBIDDEN",
      "You don't have permission to delete articles",
    );
  }

  const id = parseId((await params).articleId);
  if (id === null) return apiError("NOT_FOUND", "Article not found");

  try {
    const result = await softDeleteArticle(id, user.id);
    if (!result.ok) return apiError("NOT_FOUND", "Article not found");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error deleting article:", err);
    return apiError(
      "SERVER_ERROR",
      "Something went wrong on the server while deleting",
    );
  }
}
