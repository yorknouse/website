// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import HeaderActions, {
  type HeaderActionsProps,
} from "@/components/article-editor/HeaderActions";

const router = { push: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  router.push.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const PAST = "2020-01-01T10:00:00.000Z";
const FUTURE = "2999-01-01T10:00:00.000Z";
const LINKS = {
  site: "https://nouse.co.uk/articles/2020/01/01/a-slug",
  stats: "https://grafana.example/d/article/article-stats?var-articleid=42",
};

function renderActions(over: Partial<HeaderActionsProps> = {}) {
  const props: HeaderActionsProps = {
    articleId: 42,
    headline: "Campus news",
    showInSearch: true,
    showInAdmin: true,
    publishedUtc: PAST,
    links: LINKS,
    canDelete: false,
    onDeleted: vi.fn(),
    ...over,
  };
  render(<HeaderActions {...props} />);
  return props;
}

const link = (name: string) => screen.queryByRole("link", { name });

describe("HeaderActions", () => {
  it("links to the site and stats for a searchable, already-published article", () => {
    renderActions();
    expect(link("View on site")?.getAttribute("href")).toBe(LINKS.site);
    expect(link("Stats")?.getAttribute("href")).toBe(LINKS.stats);
    expect(link("Preview on Site")).toBeNull();
  });

  it("shows the preview instead when the article isn't in search", () => {
    renderActions({ showInSearch: false });
    expect(link("View on site")).toBeNull();
    expect(link("Stats")).toBeNull();
    expect(link("Preview on Site")?.getAttribute("href")).toBe(
      "/api/backend/articles/42/preview",
    );
  });

  it("shows the preview instead when the publish time is in the future", () => {
    renderActions({ publishedUtc: FUTURE });
    expect(link("View on site")).toBeNull();
    expect(link("Preview on Site")).toBeTruthy();
  });

  it("hides delete without permission or once hidden from admin", () => {
    renderActions({ canDelete: false });
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    cleanup();
    renderActions({ canDelete: true, showInAdmin: false });
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("deletes after confirmation, marks the form clean and goes to the list", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const props = renderActions({ canDelete: true });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/articles"));
    expect(fetchMock).toHaveBeenCalledWith("/api/backend/articles/42", {
      method: "DELETE",
    });
    expect(props.onDeleted).toHaveBeenCalled();
  });

  it("stays on the page when the delete fails", async () => {
    const alert = vi.fn();
    vi.stubGlobal("alert", alert);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Article not found" }), {
        status: 404,
      }),
    );
    const props = renderActions({ canDelete: true });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith("Article not found"),
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(props.onDeleted).not.toHaveBeenCalled();
  });
});
