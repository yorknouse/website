import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation/contact";

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { general: "Please fix the highlighted fields." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field && !(field in fieldErrors)) fieldErrors[field] = issue.message;
    }
    return NextResponse.json(
      { fieldErrors, general: "Please fix the highlighted fields." },
      { status: 400 },
    );
  }

  // TODO: send the message (parsed.data). Don't log it: it holds personal data.
  return NextResponse.json({ message: "success" }, { status: 200 });
}
