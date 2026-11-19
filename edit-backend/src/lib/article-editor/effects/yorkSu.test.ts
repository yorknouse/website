import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { articlePermalink, yorkSuEmailHtml } from "./yorkSu";

beforeEach(() => {
  vi.stubEnv("FRONTEND_URL", "https://nouse.co.uk/");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const article = {
  headline: "Big <news> & more",
  excerpt: "A strapline",
  slug: "big-news",
  articleId: 1234,
};

describe("articlePermalink", () => {
  it("uses the UTC date parts", () => {
    expect(
      articlePermalink(new Date("2026-06-30T23:30:00Z"), "late-night"),
    ).toBe("https://nouse.co.uk/articles/2026/06/30/late-night");
  });
});

describe("yorkSuEmailHtml", () => {
  const now = new Date("2026-07-01T10:00:00Z");

  it("gives advance notice and a secret link for a future article", () => {
    const html = yorkSuEmailHtml(
      { ...article, publishedUtc: new Date("2026-07-02T11:00:00Z") },
      now,
    );
    const key = createHash("md5").update("1234").digest("hex");
    expect(html).toContain(
      "This article will be published at 12:00:00 Thursday 2 Jul 2026 UK time and this email is an advanced notification of publication.",
    );
    expect(html).toContain(
      `<a href='https://nouse.co.uk/articles/2026/07/02/big-news?key=${key}'>https://nouse.co.uk/articles/2026/07/02/big-news</a>`,
    );
    expect(html).not.toContain("<b>Link to article: </b>");
  });

  it("links straight to a published article", () => {
    const html = yorkSuEmailHtml(
      { ...article, publishedUtc: new Date("2026-06-30T09:00:00Z") },
      now,
    );
    expect(html).toContain(
      "<b>Link to article: </b><a href='https://nouse.co.uk/articles/2026/06/30/big-news'>https://nouse.co.uk/articles/2026/06/30/big-news</a>",
    );
    expect(html).not.toContain("This article will be published at");
    expect(html).not.toContain("?key=");
  });

  it("keeps the charter wording and escapes the headline", () => {
    const html = yorkSuEmailHtml(
      { ...article, publishedUtc: new Date("2026-06-30T09:00:00Z") },
      now,
    );
    expect(
      html.startsWith(
        "You are receiving this email as a notification of a new article being uploaded to the Nouse.co.uk website in compliance with section 5.3 of the York SU Media Charter.<br/><br/>",
      ),
    ).toBe(true);
    expect(html).toContain(
      "<b>Headline: </b>Big &lt;news&gt; &amp; more<br/><b>Excerpt: </b>A strapline<br/>",
    );
    expect(html).toContain(
      "If you have any questions about this notification please do not hesitate to contact us on support@nouse.co.uk.<br/>For queries relating to this article itself (for example concerns about its content) please contact editor@nouse.co.uk. <br/><br/><br/>Nouse Technical Team<br/><i>",
    );
    expect(html).toContain(
      "(compliance tracked at  2026-07-01 10:00:00 UTC)</i>",
    );
  });
});
