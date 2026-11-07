// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import PublishingPanel, { useSlugOnHeadlineBlur } from "./PublishingPanel";
import type { ArticleFormValues } from "../useArticleForm";
import type { PanelProps } from "./types";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () =>
    Response.json({ slug: "campus-news" }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Harness({
  mode = "create",
  errors = {},
}: {
  mode?: "create" | "edit";
  errors?: Record<string, string>;
}) {
  const [values, setValues] = useState({
    headline: "Campus news",
    status: "draft",
    published: "2026-10-22T10:00:00",
    slug: "",
  } as ArticleFormValues);
  const setField: PanelProps["setField"] = (k, v) =>
    setValues((s) => ({ ...s, [k]: v }) as ArticleFormValues);
  const onBlur = useSlugOnHeadlineBlur({ mode, values, setField });
  return (
    <>
      <textarea
        aria-label="Headline"
        value={values.headline}
        onChange={(e) => setField("headline", e.target.value)}
        onBlur={onBlur}
      />
      <PublishingPanel
        values={values}
        setField={setField}
        errorFor={(f) => errors[f]}
      />
    </>
  );
}

describe("PublishingPanel", () => {
  it("generates the slug on headline blur, once", async () => {
    render(<Harness />);
    const headline = screen.getByLabelText("Headline");
    fireEvent.blur(headline);
    await waitFor(() =>
      expect((screen.getByLabelText("Slug") as HTMLInputElement).value).toBe(
        "campus-news",
      ),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/backend/articles/slug?headline=Campus%20news",
    );
    fireEvent.change(headline, { target: { value: "Something else" } });
    fireEvent.blur(headline);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not generate a slug when editing", () => {
    render(<Harness mode="edit" />);
    fireEvent.blur(screen.getByLabelText("Headline"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders the slug read-only, the UK-time date input and field errors", () => {
    render(<Harness errors={{ published: "Bad date" }} />);
    expect((screen.getByLabelText("Slug") as HTMLInputElement).readOnly).toBe(
      true,
    );
    const date = screen.getByLabelText(
      "Publication date (UK time)",
    ) as HTMLInputElement;
    expect(date.type).toBe("datetime-local");
    expect(date.step).toBe("1");
    expect(screen.getByText("Bad date")).toBeTruthy();
  });
});
