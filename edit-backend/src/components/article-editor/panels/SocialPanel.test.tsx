// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SocialPanel from "./SocialPanel";
import type { ArticleFormValues } from "../useArticleForm";

afterEach(cleanup);

const values = {
  postToFacebook: true,
  postToTwitter: true,
  socialExcerpt: "",
} as ArticleFormValues;

function renderPanel(socialConfig: string | undefined, errors = {}) {
  const setField = vi.fn();
  render(
    <SocialPanel
      values={values}
      setField={setField}
      errorFor={(f) => (errors as Record<string, string>)[f]}
      socialConfig={socialConfig}
    />,
  );
  return setField;
}

describe("SocialPanel", () => {
  it("disables a platform that has been posted and labels it", () => {
    renderPanel("1,1,1,0");
    const fb = screen.getByLabelText("Posted to Facebook") as HTMLInputElement;
    const tw = screen.getByLabelText("Post to Twitter") as HTMLInputElement;
    expect(fb.disabled).toBe(true);
    expect(tw.disabled).toBe(false);
    expect(
      (screen.getByPlaceholderText(/Custom excerpt/) as HTMLTextAreaElement)
        .disabled,
    ).toBe(false);
  });

  it("disables the excerpt when both are posted", () => {
    renderPanel("1,1,1,1");
    expect(
      (screen.getByPlaceholderText(/Custom excerpt/) as HTMLTextAreaElement)
        .disabled,
    ).toBe(true);
  });

  it("writes toggles and the excerpt to the form, and shows the excerpt error", () => {
    const setField = renderPanel(undefined, { socialExcerpt: "Too long" });
    fireEvent.click(screen.getByLabelText("Post to Twitter"));
    expect(setField).toHaveBeenCalledWith("postToTwitter", false);
    fireEvent.change(screen.getByPlaceholderText(/Custom excerpt/), {
      target: { value: "Hi" },
    });
    expect(setField).toHaveBeenCalledWith("socialExcerpt", "Hi");
    expect(screen.getByText("Too long")).toBeTruthy();
  });
});
