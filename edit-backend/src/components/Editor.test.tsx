// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Quill from "quill";
import DualEditor from "@/components/Editor";
import { stripSpans } from "@/components/editor/quillFormats";

// jsdom has no layout; Quill measures ranges when scrolling the caret into view.
const emptyRect = () => new DOMRect(0, 0, 0, 0);
Range.prototype.getBoundingClientRect = emptyRect;
Range.prototype.getClientRects = () =>
  ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: [][Symbol.iterator],
  }) as unknown as DOMRectList;

afterEach(cleanup);

const IMG =
  '<img src="https://cdn.example/a.png" data-fileid="5" style="width: 50%; float: left;">';

type Change = { html: string; markdown: string };

function lastChange(onChange: ReturnType<typeof vi.fn>): Change {
  const calls = onChange.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][0] as Change;
}

/** Render the editor and wait for Quill (loaded via next/dynamic). */
async function renderEditor(props: Partial<Parameters<typeof DualEditor>[0]>) {
  const onChange = vi.fn();
  const utils = render(
    <DualEditor storeAs="html" onChange={onChange} {...props} />,
  );
  const container = await waitFor(() => {
    const el = utils.container.querySelector(".ql-container");
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  const quill = Quill.find(container) as Quill;
  expect(quill).toBeInstanceOf(Quill);
  return { ...utils, onChange, quill };
}

function editorImage(container: HTMLElement) {
  const img = container.querySelector(".ql-editor img");
  expect(img).not.toBeNull();
  return img as HTMLImageElement;
}

describe("DualEditor (WYSIWYG)", () => {
  it("keeps an image's data-fileid and style through Quill edits", async () => {
    const { container, onChange, quill } = await renderEditor({
      initialHtml: `<p>Intro</p><p>${IMG}</p>`,
    });

    const img = editorImage(container);
    expect(img.getAttribute("data-fileid")).toBe("5");
    expect(img.getAttribute("style")).toBe("width: 50%; float: left;");

    act(() => {
      quill.insertText(0, "Hello ", "user");
    });

    const { html } = lastChange(onChange);
    expect(html).toContain("Hello Intro");
    expect(html).toContain('data-fileid="5"');
    expect(html).toContain("width: 50%");
    expect(html).toContain(
      '<img src="https://cdn.example/a.png" data-fileid="5" style="width: 50%; float: left;">',
    );
  });

  it("sets size and float on the selected image", async () => {
    const { container, onChange } = await renderEditor({
      initialHtml: `<p>${IMG}</p>`,
    });

    fireEvent.click(editorImage(container));
    fireEvent.click(await screen.findByRole("button", { name: "25%" }));
    fireEvent.click(screen.getByRole("button", { name: "Float right" }));

    expect(lastChange(onChange).html).toContain(
      'data-fileid="5" style="width: 25%; float: right;"',
    );

    fireEvent.click(screen.getByRole("button", { name: "No float" }));
    expect(lastChange(onChange).html).toContain(
      'data-fileid="5" style="width: 25%;"',
    );
  });

  it("adds, edits and removes a Photo Credit caption", async () => {
    const { container, onChange } = await renderEditor({
      initialHtml: `<p>Before</p><p>${IMG}</p><p>After</p>`,
    });

    fireEvent.click(editorImage(container));
    fireEvent.click(await screen.findByRole("button", { name: "Add caption" }));

    expect(lastChange(onChange).html).toBe(
      `<p>Before</p><figure style="text-align: right;">${IMG}<figcaption>Photo Credit: </figcaption></figure><p>After</p>`,
    );

    fireEvent.change(screen.getByLabelText("Caption"), {
      target: { value: "Photo Credit: Jane Doe" },
    });
    expect(lastChange(onChange).html).toContain(
      "<figcaption>Photo Credit: Jane Doe</figcaption>",
    );

    // Size tools still apply to the image inside the figure.
    fireEvent.click(screen.getByRole("button", { name: "100%" }));
    expect(lastChange(onChange).html).toContain(
      '<figure style="text-align: right;"><img src="https://cdn.example/a.png" data-fileid="5" style="width: 100%; float: left;"><figcaption>Photo Credit: Jane Doe</figcaption></figure>',
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove caption" }));
    const { html } = lastChange(onChange);
    expect(html).not.toContain("<figure");
    expect(html).toContain('data-fileid="5" style="width: 100%; float: left;"');
  });

  it("keeps a captioned image through a switch to markdown and back", async () => {
    const figure = `<figure>${IMG}<figcaption>Photo Credit: Jane</figcaption></figure>`;
    const { container, onChange, quill } = await renderEditor({
      initialHtml: `<p>Intro</p>${figure}<p>End</p>`,
    });

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    await waitFor(() =>
      expect(container.querySelector(".ql-container")).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "WYSIWYG" }));
    const back = await waitFor(() => {
      const el = container.querySelector(".ql-container");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    const quillAgain = Quill.find(back) as Quill;
    expect(quillAgain).not.toBe(quill);

    act(() => {
      quillAgain.insertText(0, "X", "user");
    });
    const { html, markdown } = lastChange(onChange);
    expect(html).toContain(figure);
    expect(markdown).toContain(figure);
  });

  it("uploads and inserts a picture from the toolbar", async () => {
    const onImageUpload = vi
      .fn()
      .mockResolvedValue({ id: 9, url: "https://cdn.example/b.png" });
    const { container, onChange } = await renderEditor({
      initialHtml: "<p>Text</p>",
      onImageUpload,
    });

    fireEvent.click(screen.getByRole("button", { name: "Insert picture" }));
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["x"], "b.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(lastChange(onChange).html).toContain(
        '<img src="https://cdn.example/b.png" data-fileid="9">',
      ),
    );
    expect(onImageUpload).toHaveBeenCalledWith(file);
  });

  it("shows the upload error message", async () => {
    const onImageUpload = vi
      .fn()
      .mockRejectedValue(new Error("That file type isn't allowed"));
    const { container } = await renderEditor({ onImageUpload });

    fireEvent.click(screen.getByRole("button", { name: "Insert picture" }));
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "a.exe")] },
    });

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "That file type isn't allowed",
    );
  });

  it("strips span wrappers from pasted HTML, keeping their text", async () => {
    expect(
      stripSpans(
        '<p>A <span style="color: red">red <b>bold</b></span> word</p>',
      ),
    ).toBe("<p>A red bold word</p>");

    const { onChange, quill } = await renderEditor({ initialHtml: "<p></p>" });
    act(() => {
      quill.setSelection(0, 0, "silent");
      const clipboard = quill.getModule("clipboard") as {
        onPaste: (
          range: { index: number; length: number },
          data: { html?: string; text?: string },
        ) => void;
      };
      clipboard.onPaste(
        { index: 0, length: 0 },
        { html: '<p>Hi <span style="color: red">there</span></p>' },
      );
    });
    expect(lastChange(onChange).html).toBe("<p>Hi there</p>");
  });
  it("keeps a PHP figure's own style through edits and markdown", async () => {
    const { container, onChange, quill } = await renderEditor({
      initialHtml:
        '<p>Intro</p><figure style="text-align: right;" class=""><img src="https://x/y.jpg" data-fileid="5"><figcaption class="">Photo Credit: X</figcaption></figure>',
    });
    const expected =
      '<figure style="text-align: right;"><img src="https://x/y.jpg" data-fileid="5"><figcaption>Photo Credit: X</figcaption></figure>';

    act(() => {
      quill.insertText(0, "A", "user");
    });
    expect(lastChange(onChange).html).toContain(expected);
    expect(lastChange(onChange).markdown).toContain(expected);

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    fireEvent.click(screen.getByRole("button", { name: "WYSIWYG" }));
    const back = await waitFor(() => {
      const el = container.querySelector(".ql-container");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    act(() => {
      (Quill.find(back) as Quill).insertText(0, "B", "user");
    });
    expect(lastChange(onChange).html).toContain(expected);
  });

  it("keeps paragraph alignment as an inline style", async () => {
    const { onChange, quill } = await renderEditor({
      initialHtml: '<p style="text-align: center">x</p>',
    });
    act(() => {
      quill.insertText(0, "A", "user");
    });
    const { html } = lastChange(onChange);
    expect(html).toBe('<p style="text-align: center;">Ax</p>');
    expect(html).not.toContain("ql-align");
  });

  function pasteFile(quill: Quill, file: File) {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: { getData: () => "", files: [file] },
    });
    act(() => {
      quill.setSelection(0, 0, "silent");
      quill.root.dispatchEvent(event);
    });
  }

  it("uploads a pasted picture file instead of inlining a data: URL", async () => {
    const onImageUpload = vi
      .fn()
      .mockResolvedValue({ id: 3, url: "https://cdn.example/p.png" });
    const { onChange, quill } = await renderEditor({
      initialHtml: "<p>Text</p>",
      onImageUpload,
    });
    const file = new File(["x"], "p.png", { type: "image/png" });

    pasteFile(quill, file);

    await waitFor(() =>
      expect(lastChange(onChange).html).toContain(
        '<img src="https://cdn.example/p.png" data-fileid="3">',
      ),
    );
    expect(onImageUpload).toHaveBeenCalledWith(file);
    expect(lastChange(onChange).html).not.toContain("data:");
  });

  it("ignores a pasted picture file when uploads are unavailable", async () => {
    const { container, onChange, quill } = await renderEditor({
      initialHtml: "<p>Text</p>",
    });

    pasteFile(quill, new File(["x"], "p.png", { type: "image/png" }));
    // Give a FileReader-based insert the chance to happen.
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(container.querySelector(".ql-editor img")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("DualEditor (markdown)", () => {
  it("inserts an uploaded picture as ![id](url) with spaces escaped", async () => {
    const onChange = vi.fn();
    const onImageUpload = vi
      .fn()
      .mockResolvedValue({ id: 12, url: "https://cdn.example/my photo.png" });
    const { container } = render(
      <DualEditor
        storeAs="markdown"
        initialMarkdown="Hello"
        onChange={onChange}
        onImageUpload={onImageUpload}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Insert picture" }),
    );
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "my photo.png")] },
    });

    await waitFor(() =>
      expect(lastChange(onChange).markdown).toContain(
        "![12](https://cdn.example/my%20photo.png)",
      ),
    );
    expect(lastChange(onChange).html).toContain(
      '<img src="https://cdn.example/my%20photo.png" alt="12">',
    );
  });

  it("toggles modes with real buttons", async () => {
    render(<DualEditor storeAs="markdown" onChange={vi.fn()} />);
    for (const name of ["Markdown", "WYSIWYG"]) {
      expect(screen.getByRole("button", { name }).getAttribute("type")).toBe(
        "button",
      );
    }
  });
});
