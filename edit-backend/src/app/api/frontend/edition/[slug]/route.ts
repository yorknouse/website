import { NextResponse } from "next/server";
import { validatePreviewToken } from "@/lib/preview";
import { sanitiseSearchTerm } from "@/lib/validation/searchTerms";
import type { IEdition } from "@/lib/types";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";
import crypto from "crypto";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const authHeader = request.headers.get("authorization");
    const hashHeader = request.headers.get("x-preview-hash");

    const validToken = validatePreviewToken(authHeader);

    const isPreview = typeof hashHeader === "string" && Boolean(validToken);

    const slugSanitised = sanitiseSearchTerm(slug);

    if (!slugSanitised || "") {
      return NextResponse.json({ message: "Invalid slug" }, { status: 400 });
    }

    const cleanSlug = decodeURIComponent(slugSanitised);

    const edition = await cache<IEdition | null>(
      `edition:slug:${cleanSlug}`,
      2592000,
      () =>
        prisma.editions.findFirst({
          where: {
            editions_slug: cleanSlug,
            editions_show: !isPreview,
            editions_deleted: false,
            NOT: {
              editions_thumbnail: null,
            },
          },
          orderBy: {
            editions_published: "desc",
          },
        }),
    );

    if (!edition) {
      return NextResponse.json(
        { message: "Edition not found" },
        { status: 404 },
      );
    }

    if (isPreview) {
      const expectedHash = crypto
        .createHash("md5")
        .update(edition.editions_id.toString())
        .digest("hex");

      if (expectedHash !== hashHeader) {
        return NextResponse.json(
          { message: "Edition not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(edition);
  } catch (err) {
    console.error("Error in getEditions:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
