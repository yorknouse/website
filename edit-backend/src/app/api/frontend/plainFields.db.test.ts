import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { makeCategory, makeUser } from "@/test/fixtures";
import { POST as listArticles } from "./articles/route";
import { GET as getArticle } from "./articles/[slug]/route";
import { GET as topArticles } from "./articles/topArticles/route";
import { GET as authorArticles } from "./authors/[authorId]/articles/route";
import { POST as categoryPage } from "./categories/[name]/page/route";
import { GET as categoryTree } from "./categories/tree/route";
import { POST as searchSuggestions } from "./searchSuggestions/route";

vi.mock("@/lib/redis", () => ({ default: {} }));
vi.mock("@/lib/cache", () => ({
  cache: (_key: string, _ttl: number, load: () => unknown) => load(),
}));
vi.mock("@/lib/articles", async (original) => ({
  ...(await original<typeof import("@/lib/articles")>()),
  getArticleImage: async () => "https://cdn.test/image.jpg",
}));

// Stored as the PHP site wrote them: safe tags kept, & encoded.
const stored = {
  articlesDrafts_headline: "<b>Fish</b> &amp; chips",
  articlesDrafts_excerpt: "<i>Salt</i> &amp; vinegar",
  articlesDrafts_thumbnailCredit: "<b>Jo</b> &amp; Sam",
};
const shown = {
  headline: "Fish & chips",
  excerpt: "Salt & vinegar",
  thumbnailCredit: "Jo & Sam",
};

let articleId: number;
let authorId: number;
let categoryName: string;
let parent: number;

beforeEach(async () => {
  const user = await makeUser();
  const top = await makeCategory();
  const category = await makeCategory({ nestUnder: top.categories_id });
  await prisma.categories.update({
    where: { categories_id: category.categories_id },
    data: { categories_showMenu: true },
  });
  const article = await prisma.articles.create({
    data: {
      articles_published: new Date("2026-01-01T12:00:00Z"),
      articles_updated: new Date(),
      articles_slug: `fish-${Date.now()}`,
      articles_type: 1,
      articles_showInLists: true,
      articles_showInSearch: true,
      articles_showInAdmin: true,
      articlesDrafts: {
        create: {
          ...stored,
          articlesDrafts_timestamp: new Date(),
          articlesDrafts_userid: user.users_userid,
          articlesDrafts_text: "<p>Body</p>",
        },
      },
      users: { create: { users_userid: user.users_userid } },
      categories: { create: { categories_id: category.categories_id } },
    },
  });
  articleId = article.articles_id;
  authorId = user.users_userid;
  categoryName = category.categories_name;
  parent = top.categories_id;
});

function form(fields: Record<string, string>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return new Request("http://test/", { method: "POST", body });
}

async function json(response: Response) {
  expect(response.status).toBe(200);
  return JSON.stringify(await response.json());
}

function expectShown(body: string, fields: string[]) {
  const values = fields.map((f) => shown[f as keyof typeof shown]);
  for (const value of values) expect(body).toContain(value);
  expect(body).not.toContain("&amp;");
  expect(body).not.toContain("<b>");
  expect(body).not.toContain("<i>");
}

const allFields = ["headline", "excerpt", "thumbnailCredit"];

describe("readers API plain fields", () => {
  it("article list", async () => {
    const res = await listArticles(
      form({ articleIds: JSON.stringify([articleId]), style: "nouse" }),
    );
    expectShown(await json(res), allFields);
  });

  it("single article", async () => {
    const { articles_slug: slug } = await prisma.articles.findUniqueOrThrow({
      where: { articles_id: articleId },
    });
    const res = await getArticle(new Request("http://test/"), {
      params: Promise.resolve({ slug: String(slug) }),
    });
    expectShown(await json(res), allFields);
  });

  it("author articles", async () => {
    const res = await authorArticles(new Request("http://test/"), {
      params: Promise.resolve({ authorId: String(authorId) }),
    });
    expectShown(await json(res), allFields);
  });

  it("category page", async () => {
    const res = await categoryPage(form({ take: "5", skip: "0" }), {
      params: Promise.resolve({ name: categoryName }),
    });
    expectShown(await json(res), allFields);
  });

  it("category tree", async () => {
    const res = await categoryTree(
      new Request(`http://test/?parent=${parent}&limit=5`),
    );
    expectShown(await json(res), allFields);
  });

  it("search suggestions", async () => {
    const res = await searchSuggestions(form({ searchterm: "Fish" }));
    expectShown(await json(res), ["headline", "excerpt"]);
  });

  it("top articles", async () => {
    await prisma.articlesReadsSummary.create({
      data: { articles_id: articleId, read_count: 3 },
    });
    // The route's SQL names the production schema, so return its row here.
    const query = vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([
      {
        articles_id: articleId,
        articles_slug: "fish",
        articles_published: new Date(),
        articlesDrafts_headline: stored.articlesDrafts_headline,
      },
    ]);
    const res = await topArticles(new Request("http://test/"));
    query.mockRestore();
    expectShown(await json(res), ["headline"]);
  });
});
