import { S3FileNotFoundError, s3URL } from "@/lib/s3URL";
import { NextResponse } from "next/server";

const corsRes = {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const fileId = searchParams.get("fileId");
    const size = searchParams.get("size");

    const fileIdNumber = Number(fileId);
    if (Number.isNaN(fileIdNumber)) {
      return NextResponse.json({ message: "Invalid fileId" }, { status: 400 });
    }

    let sizeExt: false | "tiny" | "small" | "medium" | "large" | "comp" =
      "comp";

    if (size === "tiny") sizeExt = "tiny";
    else if (size === "small") sizeExt = "small";
    else if (size === "medium") sizeExt = "medium";
    else if (size === "large") sizeExt = "large";
    else if (!size || size === "false") sizeExt = false;

    const url = await s3URL(fileIdNumber, sizeExt);

    return NextResponse.json({ url: url }, corsRes);
  } catch (err) {
    if (err instanceof S3FileNotFoundError) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    console.error("Error in s3URL:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
