import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth")>()),
  GetUserData: vi.fn(),
}));
vi.mock("@/lib/article-editor/service", () => ({
  updateArticle: vi.fn(),
  softDeleteArticle: vi.fn(),
}));

import { GetUserData } from "@/lib/auth";
import { softDeleteArticle, updateArticle } from "@/lib/article-editor/service";
import { DELETE, PUT } from "./route";

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
  body: { html: "<p>Hi</p>" },
};

const ctx = (id = "5") => ({ params: Promise.resolve({ articleId: id }) });
const put = (body: unknown, id?: string) =>
  PUT(
    new Request("http://x/api/backend/articles/5", {
      method: "PUT",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    ctx(id),
  );
const del = (id?: string) =>
  DELETE(
    new Request("http://x/api/backend/articles/5", { method: "DELETE" }),
    ctx(id),
  );

describe("PUT /api/backend/articles/[articleId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("401s without a session", async () => {
    vi.mocked(GetUserData).mockResolvedValue(null);
    expect((await put(valid)).status).toBe(401);
  });

  it("403s without permission 32", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([31, 33]));
    const res = await put(valid);
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe(
      "You don't have permission to edit articles",
    );
  });

  it("400s with fieldErrors on an invalid body", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([32]));
    const res = await put({ ...valid, headline: "" });
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.headline).toBeTruthy();
  });

  it("400s on non-JSON", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([32]));
    const res = await put("nope");
    expect(res.status).toBe(400);
    expect((await res.json()).message).toBe("Invalid request");
  });

  it("404s for a non-numeric id", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([32]));
    expect((await put(valid, "abc")).status).toBe(404);
  });

  it("404s when the service says NOT_FOUND", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([32]));
    vi.mocked(updateArticle).mockResolvedValue({
      ok: false,
      code: "NOT_FOUND",
      message: "Article not found",
    });
    expect((await put(valid)).status).toBe(404);
  });

  it("500s when the service throws", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([32]));
    vi.mocked(updateArticle).mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await put(valid);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("SERVER_ERROR");
    spy.mockRestore();
  });

  it("200s with the ids on success", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([32]));
    vi.mocked(updateArticle).mockResolvedValue({
      ok: true,
      articleId: 5,
      draftId: 9,
      warnings: [],
    });
    const res = await put(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      articleId: 5,
      draftId: 9,
      warnings: [],
    });
    expect(updateArticle).toHaveBeenCalledWith(5, expect.anything(), 7);
  });
});

describe("DELETE /api/backend/articles/[articleId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("401s without a session", async () => {
    vi.mocked(GetUserData).mockResolvedValue(null);
    expect((await del()).status).toBe(401);
  });

  it("403s without permission 33", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([31, 32]));
    const res = await del();
    expect(res.status).toBe(403);
    expect((await res.json()).message).toBe(
      "You don't have permission to delete articles",
    );
    expect(softDeleteArticle).not.toHaveBeenCalled();
  });

  it("404s when nothing was deleted", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([33]));
    vi.mocked(softDeleteArticle).mockResolvedValue({ ok: false });
    const res = await del();
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("NOT_FOUND");
  });

  it("500s when the service throws", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([33]));
    vi.mocked(softDeleteArticle).mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await del()).status).toBe(500);
    spy.mockRestore();
  });

  it("200s { ok: true } on success with the session user id", async () => {
    vi.mocked(GetUserData).mockResolvedValue(user([33]));
    vi.mocked(softDeleteArticle).mockResolvedValue({ ok: true });
    const res = await del();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(softDeleteArticle).toHaveBeenCalledWith(5, 7);
  });
});
