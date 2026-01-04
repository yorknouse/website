import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    articleId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteParams) {
  const { articleId } = await params;

  try {
    if (!articleId) {
      return NextResponse.json(
        { message: "Missing articleId" },
        { status: 400 },
      );
    }

    const id = Number(articleId);

    if (!/^\d+$/.test(articleId) || !Number.isInteger(id) || id < 0) {
      return NextResponse.json(
        { message: "Invalid articleId" },
        { status: 400 },
      );
    }

    // Fetch the article from Prisma
    const article = await prisma.articles.findUnique({
      where: { articles_id: Number(articleId) },
      select: {
        articles_slug: true,
        articles_published: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 },
      );
    }

    const { articles_slug: slug, articles_published: published } = article;

    if (!published) {
      return NextResponse.json(
        { message: "Published date missing" },
        { status: 500 },
      );
    }

    // Convert date to YYYY/MM/DD for URL
    const year = published.getFullYear();
    const month = String(published.getMonth() + 1).padStart(2, "0");
    const day = String(published.getDate()).padStart(2, "0");
    const convertedDate = `${year}/${month}/${day}`;

    // Generate preview token
    const token = process.env.DRAFT_VIEW_TOKEN;
    if (!token) {
      return NextResponse.json(
        { message: "Token is missing" },
        { status: 500 },
      );
    }

    const hash = crypto.createHash("md5").update(articleId).digest("hex");

    // Redirect to frontend preview URL
    const slugParam = Array.isArray(slug) ? slug[0] : slug;
    const frontendUrl = `${process.env.FRONTEND_URL}articles/${convertedDate}/${slugParam}?preview=true&hash=${hash}`;

    const response = NextResponse.redirect(frontendUrl);

    response.cookies.set("previewToken", token, {
      domain: ".nouse.co.uk",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (err) {
    console.error("Error in article preview route:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
