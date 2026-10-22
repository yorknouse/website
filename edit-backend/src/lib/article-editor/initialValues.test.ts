import { describe, expect, it } from "vitest";
import {
  createDefaults,
  editInitialValues,
  galleryIds,
  isArticleType,
  isCreatableType,
  type EditorArticle,
} from "./initialValues";

const bodyOf = (v: object) => (v as { body?: unknown }).body;

describe("createDefaults", () => {
  const now = new Date("2026-07-01T11:00:00Z");

  it("uses UK time now, draft, images on, both social toggles on, thumbnail 1", () => {
    expect(createDefaults(1, now)).toMatchObject({
      headline: "",
      excerpt: "",
      published: "2026-07-01T12:00:00",
      status: "draft",
      displayImages: true,
      postToFacebook: true,
      postToTwitter: true,
      thumbnailId: 1,
      editionId: null,
      categoryIds: [],
      authorIds: [],
    });
  });

  it("gives each type an empty body of the right shape", () => {
    expect(bodyOf(createDefaults(1, now))).toEqual({ html: "" });
    expect(bodyOf(createDefaults(6, now))).toEqual({ markdown: "" });
    expect(bodyOf(createDefaults(2, now))).toEqual({ images: [] });
    expect(bodyOf(createDefaults(5, now))).toEqual({ embedUrl: "" });
  });
});

describe("type guards", () => {
  it("accepts only the known types", () => {
    expect([1, 2, 3, 4, 5, 6, 7].filter(isArticleType)).toEqual([
      1, 2, 4, 5, 6,
    ]);
  });
  it("excludes liveblogs from creatable types", () => {
    expect([1, 2, 4, 5, 6].filter(isCreatableType)).toEqual([1, 2, 5, 6]);
  });
});

describe("galleryIds", () => {
  it("parses the comma-separated id list", () => {
    expect(galleryIds("12, 13,14")).toEqual([12, 13, 14]);
  });
  it("skips blanks and junk", () => {
    expect(galleryIds("")).toEqual([]);
    expect(galleryIds(null)).toEqual([]);
    expect(galleryIds("12,,abc,0,13")).toEqual([12, 13]);
  });
});

function found(over: {
  type?: number;
  text?: string | null;
  markdown?: string | null;
}): EditorArticle {
  return {
    article: {
      articles_id: 7,
      articles_type: over.type ?? 1,
      articles_published: new Date("2026-07-01T11:00:00Z"),
      articles_slug: "a-slug",
      articles_showInLists: false,
      articles_showInSearch: true,
      articles_showInAdmin: true,
      articles_socialConfig: "0,0,1,1",
      articles_socialExcerpt: "Fish &amp; chips",
      articles_dropCapital: true,
      articles_displayImages: null,
      articles_isThumbnailPortrait: true,
      editions_id: 3,
      articles_editionPage: null,
      articles_thumbnail: "55",
    },
    draft: {
      articlesDrafts_headline: "Test &amp; check",
      articlesDrafts_excerpt: "&lt;b&gt;",
      articlesDrafts_thumbnailCredit: null,
      articlesDrafts_text: over.text === undefined ? "<p>Hi\n</p>" : over.text,
      articlesDrafts_markdown: over.markdown ?? null,
    },
    categoryIds: [4, 5],
    authors: [{ id: 9, name: "Jo Bloggs" }],
    drafts: [],
  } as unknown as EditorArticle;
}

describe("editInitialValues", () => {
  const opts = { archiveUrl: "https://archive/", captions: new Map() };

  it("decodes plain fields and maps the stored flags", () => {
    expect(editInitialValues(found({}), opts)).toMatchObject({
      headline: "Test & check",
      excerpt: "<b>",
      published: "2026-07-01T12:00:00",
      status: "search",
      editionId: 3,
      editionPage: "",
      categoryIds: [4, 5],
      authorIds: [9],
      dropCap: true,
      displayImages: true,
      thumbnailPortrait: true,
      postToFacebook: false,
      postToTwitter: true,
      socialExcerpt: "Fish & chips",
      thumbnailId: null,
      thumbnailCredit: "",
      slug: "a-slug",
    });
  });

  it("runs a standard body through the legacy HTML substitutions", () => {
    const v = editInitialValues(
      found({ text: '"PS"5 [ARCHIVECDNURL]x.jpg\n' }),
      opts,
    );
    expect(bodyOf(v)).toEqual({
      html: "&pound;5 https://archive/x.jpg<br/>",
    });
  });

  it("reads a markdown body from the markdown column", () => {
    const v = editInitialValues(
      found({ type: 6, text: "<p>x</p>", markdown: "**x**" }),
      opts,
    );
    expect(bodyOf(v)).toEqual({ markdown: "**x**" });
  });

  it("builds gallery images from the ids and decoded captions", () => {
    const v = editInitialValues(found({ type: 2, text: "12,13" }), {
      ...opts,
      captions: new Map([[12, "A, B &amp; C"]]),
    });
    expect(bodyOf(v)).toEqual({
      images: [
        { id: 12, caption: "A, B & C" },
        { id: 13, caption: "" },
      ],
    });
  });

  it("uses the stored text as a print edition's embed URL", () => {
    const v = editInitialValues(
      found({ type: 5, text: "https://issuu.com/x" }),
      opts,
    );
    expect(bodyOf(v)).toEqual({ embedUrl: "https://issuu.com/x" });
  });

  it("gives a liveblog no body", () => {
    expect(bodyOf(editInitialValues(found({ type: 4 }), opts))).toBe(undefined);
  });
});
