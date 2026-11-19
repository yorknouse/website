import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const post = (body: string) =>
  POST(
    new NextRequest("http://x/api/backend/contact", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    }),
  );

describe("POST /api/backend/contact", () => {
  it("returns 400 with field errors for invalid input", async () => {
    const res = await post(
      JSON.stringify({ name: "", email: "nope", message: "short" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(Object.keys(body.fieldErrors).sort()).toEqual([
      "email",
      "message",
      "name",
    ]);
    expect(body.general).toBe("Please fix the highlighted fields.");
  });

  it("returns 400 for a body that isn't JSON", async () => {
    expect((await post("not json")).status).toBe(400);
  });

  it("accepts a valid message", async () => {
    const res = await post(
      JSON.stringify({
        name: "Sam",
        email: "sam@example.com",
        message: "Hello there, this is long enough",
      }),
    );
    expect(res.status).toBe(200);
  });
});
