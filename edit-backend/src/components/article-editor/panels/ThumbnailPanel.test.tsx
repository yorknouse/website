// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ThumbnailPanel from "./ThumbnailPanel";
import type { ArticleFormValues } from "../useArticleForm";

afterEach(cleanup);

function renderPanel(thumbnailId: number) {
  render(
    <ThumbnailPanel
      values={{ thumbnailId, thumbnailCredit: "" } as ArticleFormValues}
      setField={vi.fn()}
      errorFor={() => undefined}
    />,
  );
}

const helpButton = () =>
  screen.queryByRole("button", {
    name: "Help with < and > in the image credit",
  });

describe("ThumbnailPanel", () => {
  it("offers help with < and > beside the credit", () => {
    renderPanel(55);
    expect(helpButton()).toBeTruthy();
  });

  it("has no credit, and so no help, for the default thumbnail", () => {
    renderPanel(1);
    expect(screen.queryByPlaceholderText(/Image credit/)).toBeNull();
    expect(helpButton()).toBeNull();
  });
});
