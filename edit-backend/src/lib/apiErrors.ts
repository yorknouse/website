import { NextResponse } from "next/server";
import type { FieldErrors } from "@/lib/article-editor/schema";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SLUG_TAKEN"
  | "SERVER_ERROR";

export type ApiErrorBody = {
  error: ApiErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
  suggestedSlug?: string;
};

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SLUG_TAKEN: 409,
  SERVER_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number = STATUS[code],
  extra?: Pick<ApiErrorBody, "fieldErrors" | "suggestedSlug">,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: code, message, ...extra }, { status });
}
