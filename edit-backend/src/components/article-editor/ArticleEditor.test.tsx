// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ArticleEditor, {
  type ArticleEditorProps,
} from "@/components/article-editor/ArticleEditor";
import type { ArticleFormValues } from "@/components/article-editor/useArticleForm";

const router = { push: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  router.push.mockReset();
  router.refresh.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const LOGGED_OUT =
  "You've been logged out. Log in again in a new tab, then press Save — your changes are still here.";
const CONNECTION =
  "Couldn't reach the server. Check your connection and try again.";
const SERVER_ERROR =
  "The server hit an error saving this article. Your changes are still on this page — try again, and if it keeps happening contact support@nouse.co.uk.";

function values(over: Partial<ArticleFormValues> = {}): ArticleFormValues {
  return {
    headline: "Campus news",
    excerpt: "",
    published: "2026-10-22T10:00:00",
    status: "draft",
    editionId: null,
    editionPage: "",
    categoryIds: [],
    authorIds: [],
    dropCap: false,
    displayImages: true,
    thumbnailPortrait: false,
    postToFacebook: true,
    postToTwitter: true,
    socialExcerpt: "",
    // A credited, non-default thumbnail on a markdown article: no confirmations
    thumbnailId: 5,
    thumbnailCredit: "Photo: Jo Bloggs",
    slug: "campus-news",
    body: { markdown: "Hello **world**" },
    ...over,
  } as ArticleFormValues;
}

const options = { sections: [], categories: [], editions: [] };

function renderEditor(over: Partial<ArticleEditorProps> = {}) {
  const props: ArticleEditorProps = {
    mode: "create",
    type: 6,
    initial: values(),
    options,
    can: { delete: false },
    ...over,
  };
  return render(<ArticleEditor {...props} />);
}

const EDIT_ARTICLE = {
  id: 42,
  slug: "Legacy Slug!",
  publishedUtc: "2026-10-22T09:00:00.000Z",
  showInSearch: false,
  showInAdmin: true,
  socialConfig: "1,0,1,0",
  thumbnailId: 5,
  drafts: [],
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

function headline() {
  return screen.getByLabelText("Headline") as HTMLTextAreaElement;
}

function sentBody(call = 0) {
  return JSON.parse(fetchMock.mock.calls[call][1].body as string);
}

describe("ArticleEditor save flow", () => {
  it("shows a client-side field error and does not call fetch", async () => {
    renderEditor();
    fireEvent.change(headline(), { target: { value: "  " } });
    save();
    expect(await screen.findByText("Headline is required")).toBeTruthy();
    expect(screen.getByText(/Some fields need fixing/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a server field error and opens its collapsed panel", async () => {
    fetchMock.mockResolvedValue(
      json(400, {
        error: "VALIDATION_ERROR",
        message: "Some fields need fixing",
        fieldErrors: {
          authorIds: "One of the chosen authors no longer exists",
        },
      }),
    );
    renderEditor();
    const toggle = screen.getByRole("button", { name: "Sections & authors" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    save();
    expect(
      await screen.findByText("One of the chosen authors no longer exists"),
    ).toBeTruthy();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Some fields need fixing (1)")).toBeTruthy();
  });

  it("shows an indexed error under its control, mapped by first path segment", async () => {
    fetchMock.mockResolvedValue(
      json(400, {
        error: "VALIDATION_ERROR",
        message: "Some fields need fixing",
        fieldErrors: { "categoryIds.0": "That section no longer exists" },
      }),
    );
    renderEditor();
    save();
    const message = await screen.findByText("That section no longer exists");
    expect(message.id).toBe("categoryIds-error");
    expect(
      screen
        .getByRole("combobox", { name: "Sections" })
        .getAttribute("aria-describedby"),
    ).toBe("categoryIds-error");
    expect(screen.getAllByText("That section no longer exists")).toHaveLength(
      1,
    );
  });

  it("shows body errors no body control renders", async () => {
    fetchMock.mockResolvedValue(
      json(400, {
        error: "VALIDATION_ERROR",
        message: "Some fields need fixing",
        fieldErrors: { "body.images": "Add at least one image" },
      }),
    );
    renderEditor({
      type: 2,
      initial: values({ body: { images: [] } }),
    });
    save();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Thumbnail credited in body of article",
      }),
    );
    expect(await screen.findByText("Add at least one image")).toBeTruthy();
  });

  it("shows a body error that only another type's control renders", async () => {
    fetchMock.mockResolvedValue(
      json(400, {
        error: "VALIDATION_ERROR",
        message: "Some fields need fixing",
        fieldErrors: { "body.embedUrl": "Enter a valid embed URL" },
      }),
    );
    renderEditor({
      type: 2,
      initial: values({ body: { images: [] } }),
    });
    save();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Thumbnail credited in body of article",
      }),
    );
    expect(await screen.findByText("Enter a valid embed URL")).toBeTruthy();
  });

  it("shows the logged-out message on 401 and keeps the typed headline", async () => {
    fetchMock.mockResolvedValue(
      json(401, { error: "UNAUTHENTICATED", message: "You're not logged in" }),
    );
    renderEditor();
    fireEvent.change(headline(), { target: { value: "My typed headline" } });
    save();
    expect(await screen.findByText(LOGGED_OUT)).toBeTruthy();
    expect(headline().value).toBe("My typed headline");
  });

  it("treats a redirect to the sign-in page as logged out", async () => {
    const res = new Response("<html>Sign in</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
    Object.defineProperty(res, "redirected", { value: true });
    fetchMock.mockResolvedValue(res);
    renderEditor();
    save();
    expect(await screen.findByText(LOGGED_OUT)).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("treats a non-JSON 200 response as logged out", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Sign in</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    renderEditor();
    save();
    expect(await screen.findByText(LOGGED_OUT)).toBeTruthy();
  });

  it("shows the connection message only when fetch itself fails", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderEditor();
    save();
    expect(await screen.findByText(CONNECTION)).toBeTruthy();
  });

  it("shows the server error message, not the connection one, on 500", async () => {
    fetchMock.mockResolvedValue(
      json(500, { error: "SERVER_ERROR", message: "Something went wrong" }),
    );
    renderEditor();
    save();
    expect(await screen.findByText(SERVER_ERROR)).toBeTruthy();
    expect(screen.queryByText(CONNECTION)).toBeNull();
  });

  it("treats a non-JSON 5xx (e.g. a proxy error page) as a server error", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad gateway</html>", {
        status: 502,
        headers: { "content-type": "text/html" },
      }),
    );
    renderEditor();
    save();
    expect(await screen.findByText(SERVER_ERROR)).toBeTruthy();
    expect(screen.queryByText(LOGGED_OUT)).toBeNull();
  });

  it("shows the server message on 403 and 404", async () => {
    fetchMock.mockResolvedValueOnce(
      json(403, {
        error: "FORBIDDEN",
        message: "You don't have permission to edit articles",
      }),
    );
    renderEditor({ mode: "edit", article: EDIT_ARTICLE });
    save();
    expect(
      await screen.findByText("You don't have permission to edit articles"),
    ).toBeTruthy();

    fetchMock.mockResolvedValueOnce(
      json(404, { error: "NOT_FOUND", message: "Article not found" }),
    );
    save();
    expect(await screen.findByText("Article not found")).toBeTruthy();
  });

  it("shows warnings in a banner and the save as successful", async () => {
    fetchMock.mockResolvedValue(
      json(200, {
        articleId: 42,
        draftId: 7,
        warnings: ["Couldn't post to Facebook — it will retry automatically"],
      }),
    );
    renderEditor({ mode: "edit", article: EDIT_ARTICLE });
    save();
    expect(
      await screen.findByText(
        "Couldn't post to Facebook — it will retry automatically",
      ),
    ).toBeTruthy();
    expect(screen.getByText(/^Saved at \d\d:\d\d:\d\d$/)).toBeTruthy();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("asks for confirmation with the default thumbnail; cancel stops the save", async () => {
    renderEditor({ initial: values({ thumbnailId: 1, thumbnailCredit: "" }) });
    save();
    expect(
      await screen.findByText(
        "You haven't set a thumbnail for this article yet - are you sure you want to save it?",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("asks for the credit and body-credit confirmations in turn, then saves", async () => {
    fetchMock.mockResolvedValue(
      json(201, { articleId: 99, draftId: 1, warnings: [] }),
    );
    renderEditor({
      type: 1,
      initial: values({ thumbnailCredit: "", body: { html: "<p>Hi</p>" } }),
    });
    save();
    expect(
      await screen.findByText(
        "You haven't set a credit for the thumbnail for this article yet.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "No credit required" }));
    expect(
      await screen.findByText(/Because this article is not a conventional/),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Thumbnail credited in body of article",
      }),
    );
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/articles/99"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("creates with POST, the generated slug and the type", async () => {
    fetchMock.mockResolvedValue(
      json(201, { articleId: 99, draftId: 1, warnings: [] }),
    );
    renderEditor();
    save();
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/articles/99"),
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/backend/articles");
    expect(init.method).toBe("POST");
    expect(sentBody()).toMatchObject({ type: 6, slug: "campus-news" });
  });

  it("edits with PUT, without the slug, sending the untouched initial body", async () => {
    fetchMock.mockResolvedValue(
      json(200, { articleId: 42, draftId: 8, warnings: [] }),
    );
    renderEditor({
      mode: "edit",
      article: EDIT_ARTICLE,
      initial: values({ slug: "Legacy Slug!", thumbnailId: null }),
    });
    save();
    expect(await screen.findByText(/^Saved at/)).toBeTruthy();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/backend/articles/42");
    expect(init.method).toBe("PUT");
    const body = sentBody();
    expect(body).not.toHaveProperty("slug");
    expect(body.body).toEqual({ markdown: "Hello **world**" });
    expect(body.thumbnailId).toBeNull();
  });

  it("shows the Saving… label while the request is in flight", async () => {
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    renderEditor({ mode: "edit", article: EDIT_ARTICLE });
    save();
    const busy = await screen.findByRole("button", { name: "Saving…" });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    resolve(json(200, { articleId: 42, draftId: 8, warnings: [] }));
    expect(await screen.findByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("offers the suggested slug on 409 and uses it on the next save", async () => {
    fetchMock.mockResolvedValueOnce(
      json(409, {
        error: "SLUG_TAKEN",
        message: "That slug is already taken",
        fieldErrors: { slug: "That slug is already taken" },
        suggestedSlug: "campus-news-x7k2",
      }),
    );
    renderEditor();
    save();
    expect(await screen.findByText("That slug is already taken")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Use campus-news-x7k2" }),
    );
    expect(screen.queryByText("That slug is already taken")).toBeNull();

    fetchMock.mockResolvedValueOnce(
      json(201, { articleId: 100, draftId: 1, warnings: [] }),
    );
    save();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(sentBody(1).slug).toBe("campus-news-x7k2");
  });

  it("warns before unload only while there are unsaved changes", async () => {
    fetchMock.mockResolvedValue(
      json(200, { articleId: 42, draftId: 8, warnings: [] }),
    );
    renderEditor({ mode: "edit", article: EDIT_ARTICLE });
    const unload = () => {
      const e = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(unload()).toBe(false);
    fireEvent.change(headline(), { target: { value: "Changed" } });
    expect(unload()).toBe(true);
    save();
    expect(await screen.findByText(/^Saved at/)).toBeTruthy();
    expect(unload()).toBe(false);
  });
});
