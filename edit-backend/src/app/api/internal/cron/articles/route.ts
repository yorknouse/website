import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { runDueArticleJobs } from "@/lib/article-editor/effects/process";

export const dynamic = "force-dynamic";

function secretMatches(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || provided === null) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { processed } = await runDueArticleJobs();
  return NextResponse.json({ processed });
}
