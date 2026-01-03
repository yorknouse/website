import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetUserData } from "@/lib/auth";
import { uploadSignSchema } from "@/lib/validation/uploads";
import { s3 } from "@/lib/s3";

export async function POST(req: Request) {
  const user = await GetUserData();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = uploadSignSchema.safeParse(json);

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

  const { filename, contentType } = parsed.data;

  if (!filename.startsWith("db/webUploads/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  /**
   * Create PUT command
   */
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET!,
    Key: filename,
    ContentType: contentType,
  });

  /**
   * Generate presigned URL (5 minutes)
   */
  const url = await getSignedUrl(s3, command, {
    expiresIn: 300,
  });

  return NextResponse.json({
    method: "PUT",
    url,
    headers: {
      "content-type": contentType,
    },
  });
}
