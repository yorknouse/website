import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/article-editor/effects/process", () => ({
  runDueArticleJobs: vi.fn(),
}));

import { runDueArticleJobs } from "@/lib/article-editor/effects/process";
import { POST } from "./route";

const request = (secret?: string) =>
  new Request("http://localhost/api/internal/cron/articles", {
    method: "POST",
    headers: secret === undefined ? {} : { "x-cron-secret": secret },
  });

describe("POST /api/internal/cron/articles", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.mocked(runDueArticleJobs).mockReset();
    vi.mocked(runDueArticleJobs).mockResolvedValue({ processed: 3 });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects a missing header", async () => {
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(runDueArticleJobs).not.toHaveBeenCalled();
  });

  it("rejects a wrong header, including one of a different length", async () => {
    expect((await POST(request("wrong"))).status).toBe(401);
    expect((await POST(request("s3cret!"))).status).toBe(401);
    expect(runDueArticleJobs).not.toHaveBeenCalled();
  });

  it("rejects everything when CRON_SECRET is unset or empty", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await POST(request(""))).status).toBe(401);
    expect((await POST(request("anything"))).status).toBe(401);
    expect(runDueArticleJobs).not.toHaveBeenCalled();
  });

  it("runs the jobs with the correct header", async () => {
    const res = await POST(request("s3cret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ processed: 3 });
    expect(runDueArticleJobs).toHaveBeenCalledTimes(1);
  });
});
