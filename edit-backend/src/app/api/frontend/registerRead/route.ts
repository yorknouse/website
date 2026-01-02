import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
  try {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
    };

    const formData = await request.formData();
    const articleIdRaw = formData.get("articleId");

    if (!articleIdRaw || typeof articleIdRaw !== "string") {
      return NextResponse.json(
        { message: "Missing articleId" },
        { status: 400, headers: corsHeaders },
      );
    }

    const sanitisedId = articleIdRaw.replace(/\D/g, "");
    const articleId = Number(sanitisedId);

    if (!Number.isInteger(articleId) || articleId <= 0) {
      return NextResponse.json(
        { message: "Invalid articleId" },
        { status: 400, headers: corsHeaders },
      );
    }

    const result = await prisma.articlesReads.create({
      data: { articles_id: articleId },
    });

    if (!result) {
      return NextResponse.json(
        { message: "Insert failed" },
        { status: 500, headers: corsHeaders },
      );
    }

    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Error in registerRead:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
