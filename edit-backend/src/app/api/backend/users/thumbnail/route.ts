import { NextResponse } from "next/server";
import { updateThumbnailSchema } from "@/lib/validation/uploads";
import prisma from "@/lib/prisma";
import { GetUserData } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await GetUserData();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  let body: unknown;

  if (contentType.includes("application/json")) {
    body = await req.json();
  } else {
    const form = await req.formData();
    body = Object.fromEntries(form.entries());
  }

  const parsed = updateThumbnailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const s3fileId = parsed.data.thumbnail ?? parsed.data.s3fileId!;

  await prisma.users.update({
    where: { users_userid: user.id },
    data: {
      users_thumbnail: String(s3fileId),
    },
  });

  return NextResponse.json({ success: true });
}
