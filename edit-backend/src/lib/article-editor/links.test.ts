import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { articleSiteUrl, articleStatsUrl } from "./links";

beforeEach(() => {
  vi.stubEnv("FRONTEND_URL", "https://nouse.co.uk/");
  vi.stubEnv("GRAFANA_URL", "https://grafana.example/");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("articleSiteUrl", () => {
  it("builds the frontend URL from the publish date and slug", () => {
    expect(
      articleSiteUrl(new Date("2026-03-05T12:00:00Z"), "test--check"),
    ).toBe("https://nouse.co.uk/articles/2026/03/05/test--check");
  });
});

describe("articleStatsUrl", () => {
  it("builds the Grafana link the list page uses", () => {
    const published = new Date("2026-03-05T12:00:00Z");
    expect(articleStatsUrl(42, published)).toBe(
      `https://grafana.example/d/article/article-stats?var-articleid=42&from=${(published.valueOf() - 7200) * 1000}&to=now`,
    );
  });
});
