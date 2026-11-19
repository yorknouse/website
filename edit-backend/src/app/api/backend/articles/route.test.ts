import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth")>()),
  GetUserData: vi.fn(),
}));
vi.mock("@/lib/article-editor/service", () => ({
  createArticle: vi.fn(),
}));

import { GetUserData } from "@/lib/auth";
import { createArticle } from "@/lib/article-editor/service";
import { POST } from "./route";

const user = (perms: number[]) =>
  ({
    id: 7,
    actions: new Map(perms.map((p) => [p, true])),
  }) as unknown as Awaited<ReturnType<typeof GetUserData>>;

const valid = {
  type: 1,
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
  slug: "a-headline",
  body: { html: "<p>Hi</p>" },
};

const post = (body: unknown) =>
  POST(
    new Request("http://x/api/backend/articles", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("POST /api/backend/articles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("401s without a session", async () => {
    vi.mocked(GetUserData).mockResolvedValue(null);
    const res = await post(valid);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("UNAUTHENTICATED");
  });

  it("403s without permission 31", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([32]));
    const res = await post(valid);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: "FORBIDDEN",
      message: "You don't have permission to create articles",
    });
  });

  it("400s on a body that is not JSON", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([31]));
    const res = await post("not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "VALIDATION_ERROR",
      message: "Invalid request",
    });
  });

  it("400s with fieldErrors on an invalid body", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([31]));
    const res = await post({ ...valid, headline: "  " });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Some fields need fixing");
    expect(body.fieldErrors.headline).toBeTruthy();
    expect(createArticle).not.toHaveBeenCalled();
  });

  it("409s with suggestedSlug when the slug is taken", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([31]));
    vi.mocked(createArticle).mockResolvedValue({
      ok: false,
      code: "SLUG_TAKEN",
      message: "Slug taken",
      suggestedSlug: "a-headline-abc12",
    });
    const res = await post(valid);
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: "SLUG_TAKEN",
      suggestedSlug: "a-headline-abc12",
    });
  });

  it("500s when the service throws", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([31]));
    vi.mocked(createArticle).mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({
      error: "SERVER_ERROR",
      message: "Something went wrong on the server while saving",
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("201s with the ids on success, using the session user id", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([31]));
    vi.mocked(createArticle).mockResolvedValue({
      ok: true,
      articleId: 12,
      draftId: 34,
      warnings: ["w"],
    });
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      articleId: 12,
      draftId: 34,
      warnings: ["w"],
    });
    expect(createArticle).toHaveBeenCalledWith(expect.anything(), 7);
  });
});
