import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { makeCategory, makeEdition } from "@/test/fixtures";
import { postToIfttt } from "./ifttt";
import { sendEmail } from "./email";
import { processArticle, runDueArticleJobs } from "./process";

vi.mock("./ifttt", () => ({ postToIfttt: vi.fn() }));
vi.mock("./email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/redis", () => ({
  default: {
    del: vi.fn(async () => 1),
    // One cached key per pattern, named after it ("similarArticles:*" -> "similarArticles:42").
    scan: vi.fn(async (_cursor: string, _match: string, pattern: string) => [
      "0",
      [pattern.replaceAll("*", "42")],
    ]),
  },
}));

const ifttt = vi.mocked(postToIfttt);
const email = vi.mocked(sendEmail);

// Lets two concurrent callers genuinely interleave around the network call.
const tick = () => new Promise((r) => setTimeout(r, 20));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("FRONTEND_URL", "https://nouse.co.uk/");
  vi.stubEnv("bCMS__CLOUDFLARE_EMAIL", "cf@example.com");
  vi.stubEnv("bCMS__CLOUDFLARE_SECRET", "cf-secret");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes("/zones?name=")) {
      return Response.json({ success: true, result: [{ id: "zone1" }] });
    }
    return Response.json({ success: true });
  });
  ifttt.mockReset();
  ifttt.mockImplementation(async () => {
    await tick();
    return true;
  });
  email.mockReset();
  email.mockImplementation(async () => {
    await tick();
    return true;
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function category(id: number) {
  return prisma.categories.upsert({
    where: { categories_id: id },
    create: {
      categories_id: id,
      categories_name: `charter-${id}`,
      categories_displayName: `Charter ${id}`,
    },
    update: {},
  });
}

async function makeArticle(
  over: {
    socialConfig?: string;
    published?: Date;
    showInSearch?: boolean;
    mediaCharterDone?: number;
    categoryIds?: number[];
    socialExcerpt?: string | null;
    excerpt?: string | null;
    headline?: string;
    editionId?: number | null;
  } = {},
) {
  const a = await prisma.articles.create({
    data: {
      articles_published: over.published ?? new Date("2026-06-30T09:00:00Z"),
      articles_showInLists: true,
      articles_showInSearch: over.showInSearch ?? true,
      articles_showInAdmin: true,
      articles_slug: "an-article",
      articles_socialConfig: over.socialConfig ?? "1,0,1,0",
      articles_mediaCharterDone: over.mediaCharterDone ?? 2,
      articles_socialExcerpt: over.socialExcerpt ?? null,
      editions_id: over.editionId ?? null,
      articlesDrafts: {
        create: {
          articlesDrafts_headline: over.headline ?? "Headline &amp; more",
          articlesDrafts_excerpt:
            over.excerpt === undefined ? "Strapline" : over.excerpt,
        },
      },
      categories: {
        create: (over.categoryIds ?? []).map((categories_id) => ({
          categories_id,
        })),
      },
    },
  });
  return a.articles_id;
}

async function stored(id: number) {
  return prisma.articles.findUniqueOrThrow({
    where: { articles_id: id },
    select: { articles_socialConfig: true, articles_mediaCharterDone: true },
  });
}

const permalink = "https://nouse.co.uk/articles/2026/06/30/an-article";

describe("processArticle social posting", () => {
  it("posts a due article to each wanted platform once", async () => {
    const id = await makeArticle({ socialConfig: "1,0,1,0" });
    expect(await processArticle(id)).toEqual([]);
    expect(ifttt).toHaveBeenCalledTimes(2);
    expect(ifttt).toHaveBeenCalledWith(
      "socialMediaAutomationFB",
      "Strapline",
      permalink,
    );
    expect(ifttt).toHaveBeenCalledWith(
      "socialMediaAutomationTwitter",
      "Strapline",
      permalink,
    );
    expect((await stored(id)).articles_socialConfig).toBe("1,1,1,1");

    await processArticle(id);
    expect(ifttt).toHaveBeenCalledTimes(2);
  });

  it("never double-posts or double-emails when two runs race", async () => {
    await category(6);
    const id = await makeArticle({
      socialConfig: "1,0,1,0",
      mediaCharterDone: 0,
      categoryIds: [6],
    });
    const [a, b] = await Promise.all([processArticle(id), processArticle(id)]);
    expect([...a, ...b]).toEqual([]);
    const events = ifttt.mock.calls.map((c) => c[0]);
    expect(events.filter((e) => e === "socialMediaAutomationFB")).toHaveLength(
      1,
    );
    expect(
      events.filter((e) => e === "socialMediaAutomationTwitter"),
    ).toHaveLength(1);
    expect(email).toHaveBeenCalledTimes(1);
    expect(await stored(id)).toEqual({
      articles_socialConfig: "1,1,1,1",
      articles_mediaCharterDone: 1,
    });
  });

  it("releases the claim and warns when Facebook fails", async () => {
    ifttt.mockImplementation(
      async (event) => event !== "socialMediaAutomationFB",
    );
    const id = await makeArticle({ socialConfig: "1,0,1,0" });
    expect(await processArticle(id)).toEqual([
      "Couldn't post to Facebook — it will retry automatically",
    ]);
    expect((await stored(id)).articles_socialConfig).toBe("1,0,1,1");
  });

  it("warns for Twitter when Twitter fails", async () => {
    ifttt.mockImplementation(
      async (event) => event !== "socialMediaAutomationTwitter",
    );
    const id = await makeArticle({ socialConfig: "1,0,1,0" });
    expect(await processArticle(id)).toEqual([
      "Couldn't post to Twitter — it will retry automatically",
    ]);
    expect((await stored(id)).articles_socialConfig).toBe("1,1,1,0");
  });

  it("leaves a malformed config alone", async () => {
    const id = await makeArticle({ socialConfig: "1,0" });
    await expect(processArticle(id)).resolves.toEqual([]);
    expect(ifttt).not.toHaveBeenCalled();
    expect((await stored(id)).articles_socialConfig).toBe("1,0");
  });

  it("does nothing for a future-dated article", async () => {
    await category(6);
    const id = await makeArticle({
      published: new Date(Date.now() + 86_400_000),
      mediaCharterDone: 0,
      categoryIds: [6],
    });
    expect(await processArticle(id)).toEqual([]);
    expect(ifttt).not.toHaveBeenCalled();
    expect(email).not.toHaveBeenCalled();
    expect(await stored(id)).toEqual({
      articles_socialConfig: "1,0,1,0",
      articles_mediaCharterDone: 0,
    });
  });

  it("does nothing for an article that isn't searchable", async () => {
    const id = await makeArticle({ showInSearch: false });
    await processArticle(id);
    expect(ifttt).not.toHaveBeenCalled();
  });

  it("prefers the social excerpt, then the strapline, then the headline", async () => {
    const a = await makeArticle({
      socialConfig: "1,0,0,0",
      socialExcerpt: "Social &amp; excerpt",
    });
    await processArticle(a);
    expect(ifttt).toHaveBeenLastCalledWith(
      "socialMediaAutomationFB",
      "Social & excerpt",
      permalink,
    );

    const b = await makeArticle({ socialConfig: "1,0,0,0", excerpt: "" });
    await processArticle(b);
    expect(ifttt).toHaveBeenLastCalledWith(
      "socialMediaAutomationFB",
      "Headline & more",
      permalink,
    );
  });
});

describe("processArticle York SU notification", () => {
  it("emails York SU for a charter category", async () => {
    await category(6);
    const id = await makeArticle({
      socialConfig: "0,0,0,0",
      mediaCharterDone: 0,
      categoryIds: [6],
    });
    expect(await processArticle(id)).toEqual([]);
    expect(email).toHaveBeenCalledTimes(1);
    const [to, subject, html] = email.mock.calls[0];
    expect(to).toEqual({
      email: "media-charter-notifications@nouse.co.uk",
      name: "York SU Media Charter",
    });
    expect(subject).toBe("New article on Nouse.co.uk");
    expect(html).toContain("<b>Headline: </b>Headline &amp; more<br/>");
    expect(html).toContain(`<b>Link to article: </b><a href='${permalink}'>`);
    expect((await stored(id)).articles_mediaCharterDone).toBe(1);
  });

  it("marks other categories done without emailing", async () => {
    await category(99);
    const id = await makeArticle({
      socialConfig: "0,0,0,0",
      mediaCharterDone: 0,
      categoryIds: [99],
    });
    expect(await processArticle(id)).toEqual([]);
    expect(email).not.toHaveBeenCalled();
    expect((await stored(id)).articles_mediaCharterDone).toBe(2);
  });

  it("releases the claim and warns when the email fails", async () => {
    email.mockResolvedValue(false);
    await category(6);
    const id = await makeArticle({
      socialConfig: "0,0,0,0",
      mediaCharterDone: 0,
      categoryIds: [6],
    });
    expect(await processArticle(id)).toEqual([
      "Couldn't send the York SU notification — it will retry automatically",
    ]);
    expect((await stored(id)).articles_mediaCharterDone).toBe(0);
  });
});

describe("processArticle cache purge", () => {
  it("purges the article, both editions and all categories", async () => {
    const current = await makeEdition();
    const previous = await makeEdition();
    const kept = await makeCategory();
    await category(4);
    const dropped = await makeCategory({ nestUnder: 4 });
    const id = await makeArticle({
      socialConfig: "0,0,0,0",
      editionId: current.editions_id,
      categoryIds: [kept.categories_id],
    });
    const warnings = await processArticle(id, {
      purge: {
        previousEditionId: previous.editions_id,
        previousCategoryIds: [dropped.categories_id],
      },
    });
    expect(warnings).toEqual([]);

    const purge = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/zones/zone1/purge_cache"),
    );
    expect(purge).toBeDefined();
    const [, init] = purge!;
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "X-Auth-Email": "cf@example.com",
      "X-Auth-Key": "cf-secret",
    });
    expect(JSON.parse(init.body).files.sort()).toEqual(
      [
        permalink,
        `https://nouse.co.uk/editions/${current.editions_slug}`,
        `https://nouse.co.uk/editions/${previous.editions_slug}`,
        `https://nouse.co.uk/${kept.categories_name}`,
        `https://nouse.co.uk/muse/${dropped.categories_name}`,
      ].sort(),
    );

    const { default: redis } = await import("@/lib/redis");
    const deleted = vi.mocked(redis.del).mock.calls.flat();
    expect(deleted).toEqual(
      expect.arrayContaining([
        "article:slug:an-article",
        `edition:slug:${current.editions_slug}`,
        `edition:slug:${previous.editions_slug}`,
        "featuredHome:latest",
        "similarArticles:42",
        "categoryPage:name:42",
        "categoryCount:name:42",
        "categoryFeatured:name:42",
        "articlesList:42",
        "topArticles:42",
        `authors:articleId:${id}`,
      ]),
    );
  });

  it("warns when Cloudflare rejects the purge", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/zones?name=")) {
        return Response.json({ success: true, result: [{ id: "zone1" }] });
      }
      return Response.json({ success: false }, { status: 500 });
    });
    const id = await makeArticle({ socialConfig: "0,0,0,0" });
    expect(
      await processArticle(id, {
        purge: { previousEditionId: null, previousCategoryIds: [] },
      }),
    ).toEqual([
      "Couldn't clear the website cache — changes may take up to 2 hours to appear",
    ]);
  });

  it("doesn't purge unless asked", async () => {
    const id = await makeArticle({ socialConfig: "0,0,0,0" });
    await processArticle(id);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("runDueArticleJobs", () => {
  it("processes only searchable, published articles with work due", async () => {
    await category(6);
    const social = await makeArticle({ socialConfig: "0,0,1,0" });
    const charter = await makeArticle({
      socialConfig: "0,0,0,0",
      mediaCharterDone: 0,
      categoryIds: [6],
    });
    await makeArticle({ socialConfig: "1,1,1,1" });
    await makeArticle({
      socialConfig: "1,0,1,0",
      published: new Date(Date.now() + 86_400_000),
    });
    await makeArticle({ socialConfig: "1,0,1,0", showInSearch: false });

    expect(await runDueArticleJobs()).toEqual({ processed: 2 });
    expect(ifttt).toHaveBeenCalledTimes(1);
    expect(ifttt).toHaveBeenCalledWith(
      "socialMediaAutomationTwitter",
      "Strapline",
      permalink,
    );
    expect(email).toHaveBeenCalledTimes(1);
    expect((await stored(social)).articles_socialConfig).toBe("0,0,1,1");
    expect((await stored(charter)).articles_mediaCharterDone).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
