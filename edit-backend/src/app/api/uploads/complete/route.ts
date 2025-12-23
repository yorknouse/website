import { NextResponse } from "next/server";
import {
  uploadCompleteSchema,
  normalizeUploadCompletePayload,
} from "@/lib/validation/uploads";
import prisma from "@/lib/prisma";
import { GetUserData } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await GetUserData();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  let body: any;

  if (contentType.includes("application/json")) {
    body = await req.json();
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const formText = await req.text();
    body = Object.fromEntries(new URLSearchParams(formText));
  } else {
    throw new Error("Unsupported content type: " + contentType);
  }

  const rawBody = body; // parsed from JSON or form
  const normalised = normalizeUploadCompletePayload(rawBody);

  const parsed = uploadCompleteSchema.safeParse(normalised);

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

  const {
    s3Key,
    originalName,
    size,
    public: isPublic,
    typeid,
    subtype,
    path,
    filename,
    extension,
  } = parsed.data;

  const record = await prisma.s3files.create({
    data: {
      s3files_path: path,
      s3files_filename: filename,
      s3files_extension: extension,
      s3files_original_name: originalName,
      s3files_region: process.env.AWS_DEFAULT_REGION!,
      s3files_endpoint: process.env.AWS_ENDPOINT_URL!.replace(/^http(s)?:\/\//, ""),
      s3files_cdn_endpoint: process.env.AWS_CDN!,
      s3files_bucket: process.env.AWS_BUCKET!,
      s3files_meta_size: BigInt(size),
      s3files_meta_public: isPublic,
      s3files_meta_type: typeid,
      s3files_meta_subType: subtype,
      users_userid: user.id,
    },
  });

  return NextResponse.json({
    result: true,
    response: {
      id: record.s3files_id,
      url: `${process.env.AWS_CDN}/${s3Key}`,
    },
  });
}
