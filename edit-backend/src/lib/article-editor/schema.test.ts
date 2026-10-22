import { describe, expect, it } from "vitest";
import { articleSaveSchema, zodToFieldErrors } from "./schema";

const base = {
  headline: "A headline",
  published: "2026-10-21T09:30",
  status: "draft",
  editionId: null,
  thumbnailId: null,
  dropCap: false,
  displayImages: true,
  thumbnailPortrait: false,
  postToFacebook: false,
  postToTwitter: false,
  socialExcerpt: "",
  thumbnailCredit: "",
};

function errorsFor(payload: unknown) {
  const r = articleSaveSchema.safeParse(payload);
  if (r.success) throw new Error("expected failure");
  return zodToFieldErrors(r.error);
}

describe("articleSaveSchema", () => {
  it("reports a blank headline", () => {
    expect(
      errorsFor({
        ...base,
        type: 1,
        headline: "  ",
        body: { html: "<p>x</p>" },
      }),
    ).toEqual({ headline: "Headline is required" });
  });

  it("reports an over-long social excerpt", () => {
    expect(
      errorsFor({
        ...base,
        type: 1,
        socialExcerpt: "a".repeat(281),
        body: { html: "" },
      }),
    ).toEqual({
      socialExcerpt: "Social excerpt must be 280 characters or fewer",
    });
  });

  it("reports an invalid publication date", () => {
    expect(
      errorsFor({
        ...base,
        type: 1,
        published: "2026-13-45T99:99",
        body: { html: "" },
      }),
    ).toEqual({ published: "Enter a valid publication date and time" });
  });

  it("reports an invalid embed URL under body.embedUrl", () => {
    expect(errorsFor({ ...base, type: 5, body: { embedUrl: "nope" } })).toEqual(
      { "body.embedUrl": "Enter a valid embed URL" },
    );
  });

  it("rejects a non-http embed URL", () => {
    expect(
      errorsFor({
        ...base,
        type: 5,
        body: { embedUrl: "javascript:alert(1)" },
      }),
    ).toEqual({ "body.embedUrl": "Enter a valid embed URL" });
  });

  it("reports a bad slug", () => {
    expect(
      errorsFor({ ...base, type: 1, slug: "Bad Slug", body: { html: "" } }),
    ).toEqual({
      slug: "Slug can only contain lowercase letters, numbers, - and _",
    });
  });

  it("keeps gallery captions unchanged", () => {
    const r = articleSaveSchema.parse({
      ...base,
      type: 2,
      body: { images: [{ id: 3, caption: "Left, right, centre" }] },
    });
    expect(r.type === 2 && r.body.images[0].caption).toBe(
      "Left, right, centre",
    );
  });

  it("keys gallery caption errors by index", () => {
    expect(
      errorsFor({
        ...base,
        type: 2,
        body: { images: [{ id: 3, caption: "a".repeat(501) }] },
      }),
    ).toHaveProperty(["body.images.0.caption"]);
  });

  it("accepts type 4 with no body and applies defaults", () => {
    const r = articleSaveSchema.parse({ ...base, type: 4 });
    expect(r.categoryIds).toEqual([]);
    expect(r.excerpt).toBe("");
  });
});
