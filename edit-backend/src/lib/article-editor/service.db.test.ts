import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { articleSaveSchema, type ArticleSaveInput } from "./schema";
import { decodeText } from "./content";
import {
  createArticle,
  getArticleForEditor,
  getEditorOptions,
  isSlugTaken,
  softDeleteArticle,
  updateArticle,
} from "./service";
import {
  makeCategory,
  makeEdition,
  makeS3File,
  makeUser,
} from "@/test/fixtures";

function input(over: Record<string, unknown> = {}): ArticleSaveInput {
  return articleSaveSchema.parse({
    type: 1,
    headline: "A headline",
    excerpt: "A strapline",
    published: "2026-07-01T12:00",
    status: "published",
    editionId: null,
    categoryIds: [],
    authorIds: [],
    dropCap: false,
    displayImages: true,
    thumbnailPortrait: false,
    postToFacebook: true,
    postToTwitter: true,
    thumbnailId: null,
    slug: "a-headline",
    body: { html: "<p>Hello</p>" },
    ...over,
  });
}

async function created(over: Record<string, unknown> = {}, userId?: number) {
  const uid = userId ?? (await makeUser()).users_userid;
  const res = await createArticle(input(over), uid);
  if (!res.ok) throw new Error(`create failed: ${JSON.stringify(res)}`);
  return { ...res, userId: uid };
}

describe("createArticle", () => {
  it("writes the article, first draft, joins and audit row", async () => {
    const user = await makeUser();
    const author = await makeUser();
    const section = await makeCategory();
    const res = await createArticle(
      input({
        categoryIds: [section.categories_id],
        authorIds: [author.users_userid],
      }),
      user.users_userid,
    );
    expect(res).toMatchObject({ ok: true, warnings: [] });
    if (!res.ok) return;

    const a = await prisma.articles.findUniqueOrThrow({
      where: { articles_id: res.articleId },
    });
    expect(a.articles_showInLists).toBe(true);
    expect(a.articles_showInSearch).toBe(true);
    expect(a.articles_showInAdmin).toBe(true);
    expect(a.articles_socialConfig).toBe("1,0,1,0");
    expect(a.articles_published?.toISOString()).toBe(
      "2026-07-01T11:00:00.000Z",
    );
    expect(a.articles_thumbnail).toBe("1");
    expect(a.articles_slug).toBe("a-headline");
    expect(a.articles_type).toBe(1);
    expect(a.articles_updated).not.toBeNull();

    const drafts = await prisma.articlesDrafts.findMany({
      where: { articles_id: res.articleId },
    });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].articlesDrafts_id).toBe(res.draftId);
    expect(drafts[0].articlesDrafts_headline).toBe("A headline");
    expect(drafts[0].articlesDrafts_text).toBe("<p>Hello</p>");
    expect(drafts[0].articlesDrafts_userid).toBe(user.users_userid);

    const cats = await prisma.articlesCategories.findMany({
      where: { articles_id: res.articleId },
    });
    expect(cats.map((c) => c.categories_id)).toEqual([section.categories_id]);
    const authors = await prisma.articlesAuthors.findMany({
      where: { articles_id: res.articleId },
    });
    expect(authors.map((x) => x.users_userid)).toEqual([author.users_userid]);

    const audit = await prisma.auditLog.findMany();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      auditLog_actionType: "CREATE",
      auditLog_actionTable: "articles",
      auditLog_actionData: String(res.articleId),
      users_userid: user.users_userid,
    });
  });

  it("returns SLUG_TAKEN with a suggestion when the slug exists", async () => {
    await created({ slug: "taken" });
    const user = await makeUser();
    const res = await createArticle(
      input({ slug: "taken" }),
      user.users_userid,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("SLUG_TAKEN");
    expect(res.fieldErrors?.slug).toBe("That slug is already taken");
    expect(res.suggestedSlug).toMatch(/^taken-[a-z0-9]{5}$/);
    expect(await prisma.articles.count()).toBe(1);
  });

  it("rejects an unknown author and writes nothing", async () => {
    const user = await makeUser();
    const res = await createArticle(
      input({ authorIds: [99999999] }),
      user.users_userid,
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.code).toBe("VALIDATION_ERROR");
    expect(res.fieldErrors?.authorIds).toBe(
      "One of the chosen authors no longer exists",
    );
    expect(await prisma.articles.count()).toBe(0);
    expect(await prisma.articlesDrafts.count()).toBe(0);
    expect(await prisma.auditLog.count()).toBe(0);
  });

  it("collects errors for deleted authors, missing categories, editions and images", async () => {
    const user = await makeUser();
    const gone = await makeUser({ deleted: true });
    const oldEdition = await makeEdition({ deleted: true });
    const res = await createArticle(
      input({
        type: 2,
        body: { images: [{ id: 99999999, caption: "x" }] },
        authorIds: [gone.users_userid],
        categoryIds: [99999999],
        editionId: oldEdition.editions_id,
        thumbnailId: 99999998,
      }),
      user.users_userid,
    );
    expect(res).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
      fieldErrors: {
        authorIds: "One of the chosen authors no longer exists",
        categoryIds:
          "One of the chosen sections or categories no longer exists",
        editionId: "That edition no longer exists",
        thumbnailId: "Image not found — try uploading it again",
        "body.images.0.caption": "Image not found — try uploading it again",
      },
    });
    expect(await prisma.articles.count()).toBe(0);
  });

  it("refuses to create a liveblog (type 4)", async () => {
    const user = await makeUser();
    const res = await createArticle(input({ type: 4 }), user.users_userid);
    expect(res).toMatchObject({ ok: false, code: "VALIDATION_ERROR" });
    expect(await prisma.articles.count()).toBe(0);
  });

  it("stores gallery ids and captions with commas", async () => {
    const img = await makeS3File();
    const img2 = await makeS3File();
    const res = await created({
      type: 2,
      body: {
        images: [
          { id: img.s3files_id, caption: "Left, right" },
          { id: img2.s3files_id, caption: "Tom & Jerry" },
        ],
      },
    });
    const draft = await prisma.articlesDrafts.findUniqueOrThrow({
      where: { articlesDrafts_id: res.draftId },
    });
    expect(draft.articlesDrafts_text).toBe(
      `${img.s3files_id},${img2.s3files_id}`,
    );
    const files = await prisma.s3files.findMany({
      where: { s3files_id: { in: [img.s3files_id, img2.s3files_id] } },
      orderBy: { s3files_id: "asc" },
    });
    expect(files.map((f) => f.s3files_meta_caption)).toEqual([
      "Left, right",
      "Tom &amp; Jerry",
    ]);
  });

  it("stores markdown and its rendered, sanitised HTML for type 6", async () => {
    const res = await created({
      type: 6,
      body: { markdown: "# Title\n\n<script>x</script>hello" },
    });
    const draft = await prisma.articlesDrafts.findUniqueOrThrow({
      where: { articlesDrafts_id: res.draftId },
    });
    expect(draft.articlesDrafts_markdown).toBe(
      "# Title\n\n<script>x</script>hello",
    );
    expect(draft.articlesDrafts_text).toContain("<h1>Title</h1>");
    expect(draft.articlesDrafts_text).not.toContain("<script");
  });

  it("stores a type 5 URL as entered", async () => {
    const url = "https://issuu.com/nouse/docs/a?x=1&y=2";
    const res = await created({ type: 5, body: { embedUrl: url } });
    const draft = await prisma.articlesDrafts.findUniqueOrThrow({
      where: { articlesDrafts_id: res.draftId },
    });
    expect(draft.articlesDrafts_text).toBe(url);
  });
});

describe("updateArticle", () => {
  it("adds a new draft, keeps the first, never changes the slug", async () => {
    const first = await created();
    const editor = await makeUser();
    const res = await updateArticle(
      first.articleId,
      input({ headline: "Changed", slug: "something-else" }),
      editor.users_userid,
    );
    expect(res).toMatchObject({ ok: true, articleId: first.articleId });
    if (!res.ok) return;
    expect(res.draftId).not.toBe(first.draftId);

    const drafts = await prisma.articlesDrafts.findMany({
      where: { articles_id: first.articleId },
      orderBy: { articlesDrafts_id: "asc" },
    });
    expect(drafts.map((d) => d.articlesDrafts_headline)).toEqual([
      "A headline",
      "Changed",
    ]);
    expect(drafts[1].articlesDrafts_userid).toBe(editor.users_userid);

    const a = await prisma.articles.findUniqueOrThrow({
      where: { articles_id: first.articleId },
    });
    expect(a.articles_slug).toBe("a-headline");

    const audit = await prisma.auditLog.findMany({
      orderBy: { auditLog_id: "asc" },
    });
    expect(audit.map((x) => x.auditLog_actionType)).toEqual(["CREATE", "EDIT"]);
    expect(audit[1]).toMatchObject({
      auditLog_actionTable: "articles",
      auditLog_actionData: String(first.articleId),
      users_userid: editor.users_userid,
    });
  });

  it("replaces authors and categories with exactly the new set", async () => {
    const [a, b, c] = [await makeUser(), await makeUser(), await makeUser()];
    const [x, y] = [await makeCategory(), await makeCategory()];
    const first = await created({
      authorIds: [a.users_userid, b.users_userid],
      categoryIds: [x.categories_id],
    });
    const res = await updateArticle(
      first.articleId,
      input({
        authorIds: [b.users_userid, c.users_userid],
        categoryIds: [y.categories_id],
      }),
      first.userId,
    );
    expect(res.ok).toBe(true);
    const authors = await prisma.articlesAuthors.findMany({
      where: { articles_id: first.articleId },
    });
    expect(authors.map((r) => r.users_userid).sort()).toEqual(
      [b.users_userid, c.users_userid].sort(),
    );
    const cats = await prisma.articlesCategories.findMany({
      where: { articles_id: first.articleId },
    });
    expect(cats.map((r) => r.categories_id)).toEqual([y.categories_id]);
  });

  it("round-trips an escaped headline without double escaping", async () => {
    const first = await created({ headline: "Tom & Jerry" });
    const loaded = await getArticleForEditor(first.articleId);
    expect(loaded?.draft?.articlesDrafts_headline).toBe("Tom &amp; Jerry");
    const res = await updateArticle(
      first.articleId,
      input({ headline: decodeText(loaded!.draft!.articlesDrafts_headline) }),
      first.userId,
    );
    if (!res.ok) throw new Error("update failed");
    const draft = await prisma.articlesDrafts.findUniqueOrThrow({
      where: { articlesDrafts_id: res.draftId },
    });
    expect(draft.articlesDrafts_headline).toBe("Tom &amp; Jerry");
  });

  it("keeps the previous body of a liveblog (type 4)", async () => {
    const user = await makeUser();
    const article = await prisma.articles.create({
      data: {
        articles_type: 4,
        articles_slug: "live",
        articles_socialConfig: "1,1,1,1",
      },
    });
    await prisma.articlesDrafts.create({
      data: {
        articles_id: article.articles_id,
        articlesDrafts_headline: "Live",
        articlesDrafts_text: "<div>premium embed</div>",
      },
    });
    const res = await updateArticle(
      article.articles_id,
      {
        ...input({ type: 4 }),
        body: { html: "<p>replaced</p>" },
      } as ArticleSaveInput,
      user.users_userid,
    );
    if (!res.ok) throw new Error(`update failed: ${JSON.stringify(res)}`);
    const draft = await prisma.articlesDrafts.findUniqueOrThrow({
      where: { articlesDrafts_id: res.draftId },
    });
    expect(draft.articlesDrafts_text).toBe("<div>premium embed</div>");
    const a = await prisma.articles.findUniqueOrThrow({
      where: { articles_id: article.articles_id },
    });
    expect(a.articles_socialConfig).toBe("1,1,1,1");
  });

  it("rejects a type change", async () => {
    const first = await created();
    const res = await updateArticle(
      first.articleId,
      input({ type: 5, body: { embedUrl: "https://example.com" } }),
      first.userId,
    );
    expect(res).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
      fieldErrors: { type: "Article type cannot be changed" },
    });
  });

  it("returns NOT_FOUND for a missing article", async () => {
    const user = await makeUser();
    const res = await updateArticle(99999999, input(), user.users_userid);
    expect(res).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });

  it("only turns off a social toggle that has not posted", async () => {
    const first = await created();
    await prisma.articles.update({
      where: { articles_id: first.articleId },
      data: { articles_socialConfig: "1,1,1,0" },
    });
    await updateArticle(
      first.articleId,
      input({ postToFacebook: false, postToTwitter: false }),
      first.userId,
    );
    const a = await prisma.articles.findUniqueOrThrow({
      where: { articles_id: first.articleId },
    });
    expect(a.articles_socialConfig).toBe("1,1,0,0");
  });
});

describe("updateArticle with references deleted since they were linked", () => {
  it("keeps an already linked author who has since been deleted", async () => {
    const author = await makeUser();
    const first = await created({ authorIds: [author.users_userid] });
    await prisma.users.update({
      where: { users_userid: author.users_userid },
      data: { users_deleted: true },
    });
    const res = await updateArticle(
      first.articleId,
      input({ authorIds: [author.users_userid] }),
      first.userId,
    );
    expect(res.ok).toBe(true);
    const rows = await prisma.articlesAuthors.findMany({
      where: { articles_id: first.articleId },
    });
    expect(rows.map((r) => r.users_userid)).toEqual([author.users_userid]);
  });

  it("rejects adding a different deleted author", async () => {
    const author = await makeUser();
    const other = await makeUser({ deleted: true });
    const first = await created({ authorIds: [author.users_userid] });
    await prisma.users.update({
      where: { users_userid: author.users_userid },
      data: { users_deleted: true },
    });
    const res = await updateArticle(
      first.articleId,
      input({ authorIds: [author.users_userid, other.users_userid] }),
      first.userId,
    );
    expect(res).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
      fieldErrors: { authorIds: "One of the chosen authors no longer exists" },
    });
  });

  it("keeps an already linked edition that has since been deleted", async () => {
    const edition = await makeEdition();
    const first = await created({ editionId: edition.editions_id });
    await prisma.editions.update({
      where: { editions_id: edition.editions_id },
      data: { editions_deleted: true },
    });
    const res = await updateArticle(
      first.articleId,
      input({ editionId: edition.editions_id }),
      first.userId,
    );
    expect(res.ok).toBe(true);
    const a = await prisma.articles.findUniqueOrThrow({
      where: { articles_id: first.articleId },
    });
    expect(a.editions_id).toBe(edition.editions_id);
  });

  it("rejects switching to a different deleted edition", async () => {
    const edition = await makeEdition();
    const other = await makeEdition({ deleted: true });
    const first = await created({ editionId: edition.editions_id });
    await prisma.editions.update({
      where: { editions_id: edition.editions_id },
      data: { editions_deleted: true },
    });
    const res = await updateArticle(
      first.articleId,
      input({ editionId: other.editions_id }),
      first.userId,
    );
    expect(res).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
      fieldErrors: { editionId: "That edition no longer exists" },
    });
  });

  it("accepts the default thumbnail id 1 without an s3files row", async () => {
    await prisma.s3files.deleteMany({ where: { s3files_id: 1 } });
    const first = await created({ thumbnailId: 1 });
    const res = await updateArticle(
      first.articleId,
      input({ thumbnailId: 1 }),
      first.userId,
    );
    expect(res.ok).toBe(true);
    const a = await prisma.articles.findUniqueOrThrow({
      where: { articles_id: first.articleId },
    });
    expect(a.articles_thumbnail).toBe("1");
  });
});

describe("softDeleteArticle", () => {
  it("clears the flags, audits DELETE and hides it from the editor", async () => {
    const first = await created();
    expect(await softDeleteArticle(first.articleId, first.userId)).toEqual({
      ok: true,
    });
    const a = await prisma.articles.findUniqueOrThrow({
      where: { articles_id: first.articleId },
    });
    expect([
      a.articles_showInLists,
      a.articles_showInSearch,
      a.articles_showInAdmin,
    ]).toEqual([false, false, false]);
    const audit = await prisma.auditLog.findFirst({
      where: { auditLog_actionType: "DELETE" },
    });
    expect(audit?.auditLog_actionData).toBe(String(first.articleId));
    expect(await getArticleForEditor(first.articleId)).toBeNull();
  });
});

describe("isSlugTaken / getArticleForEditor / getEditorOptions", () => {
  it("reports taken slugs", async () => {
    await created({ slug: "in-use" });
    expect(await isSlugTaken("in-use")).toBe(true);
    expect(await isSlugTaken("free-slug")).toBe(false);
  });

  it("loads the latest draft, ids, author names and drafts newest first", async () => {
    const author = await makeUser({ name1: "Ada", name2: "Lovelace" });
    const cat = await makeCategory();
    const first = await created({
      authorIds: [author.users_userid],
      categoryIds: [cat.categories_id],
    });
    await updateArticle(
      first.articleId,
      input({
        headline: "Second",
        authorIds: [author.users_userid],
        categoryIds: [cat.categories_id],
      }),
      author.users_userid,
    );
    const loaded = await getArticleForEditor(first.articleId);
    expect(loaded?.draft?.articlesDrafts_headline).toBe("Second");
    expect(loaded?.categoryIds).toEqual([cat.categories_id]);
    expect(loaded?.authors).toEqual([
      { id: author.users_userid, name: "Ada Lovelace" },
    ]);
    expect(loaded?.drafts.map((d) => d.articlesDrafts_headline)).toEqual([
      "Second",
      "A headline",
    ]);
    expect(loaded?.drafts[0].userName).toBe("Ada Lovelace");
  });

  it("builds sections, grouped categories and edition labels", async () => {
    const top = await makeCategory({ order: 99999 });
    const child = await makeCategory({
      nestUnder: top.categories_id,
      displayName: "Child",
    });
    const grandchild = await makeCategory({
      nestUnder: child.categories_id,
      displayName: "Grandchild",
    });
    await makeCategory({ nestUnder: top.categories_id, showPublic: false });
    const ed = await makeEdition({ name: "Freshers", printNumber: 7 });

    const opts = await getEditorOptions();
    expect(opts.sections).toContainEqual({
      id: top.categories_id,
      name: top.categories_displayName,
    });
    expect(opts.sections.map((s) => s.id)).not.toContain(child.categories_id);
    const group = opts.categories.find(
      (g) => g.groupName === top.categories_displayName,
    );
    expect(group?.items).toEqual([
      { id: child.categories_id, name: "Child" },
      { id: grandchild.categories_id, name: "Grandchild" },
    ]);
    expect(opts.editions).toContainEqual({
      id: ed.editions_id,
      label: "Freshers (Number 7)",
    });
  });
});
