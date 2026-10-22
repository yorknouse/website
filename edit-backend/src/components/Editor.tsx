"use client";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import rehypeSanitize from "rehype-sanitize";
import { marked } from "marked";
import TurndownService from "turndown";
import * as commands from "@uiw/react-md-editor";
import type { ICommand, TextAreaTextApi } from "@uiw/react-md-editor";
import type { UploadedImage } from "@/components/editor/QuillEditor";

const underlineCommand: ICommand = {
  name: "underline",
  keyCommand: "underline",
  buttonProps: { "aria-label": "Underline", title: "Underline" },
  icon: <span className="font-bold underline">U</span>,
  execute: (state, api) => {
    const underlined = `<u>${state.selectedText}</u>`;
    api.replaceSelection(underlined);
  },
};

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const QuillEditor = dynamic(() => import("@/components/editor/QuillEditor"), {
  ssr: false,
});

export interface DualEditorProps {
  initialHtml?: string;
  initialMarkdown?: string;
  /** Which form the article stores; also the mode the editor opens in. */
  storeAs: "html" | "markdown";
  onChange: (v: { html: string; markdown: string }) => void;
  /** Uploads an inserted picture; enables the "Insert picture" buttons. */
  onImageUpload?: (file: File) => Promise<UploadedImage>;
}

function createTurndown() {
  const t = new TurndownService({
    headingStyle: "atx", // '# Header'
    bulletListMarker: "-", // '-' instead of '*'
    emDelimiter: "*", // '*italic*' instead of '_italic_'
    strongDelimiter: "**", // '**bold**' instead of '__bold__'
    codeBlockStyle: "fenced", // triple backticks for code
  });
  t.use(require("turndown-plugin-gfm").gfm);
  // Markdown has no syntax for captions, sizes or file ids, so keep those
  // images as raw HTML (marked passes it back through unchanged).
  t.keep(["figure"]);
  t.addRule("articleImage", {
    filter: (node) =>
      node.nodeName === "IMG" &&
      (node.hasAttribute("data-fileid") || node.hasAttribute("style")),
    replacement: (_content, node) => (node as HTMLElement).outerHTML,
  });
  return t;
}

let turndown: TurndownService | null = null;

function htmlToMarkdown(html: string): string {
  turndown ??= createTurndown();
  return turndown
    .turndown(html || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown || "", { async: false });
}

/** Markdown for an uploaded picture (`![id](url)`, as the PHP editor did). */
function pictureMarkdown(image: UploadedImage): string {
  return `![${image.id}](${image.url.replace(/ /g, "%20")})`;
}

const modeButtonClass = (active: boolean) =>
  `px-3 py-1 rounded ${active ? "bg-blue-600 text-white" : "bg-gray-200"}`;

export default function DualEditor({
  initialHtml,
  initialMarkdown,
  storeAs,
  onChange,
  onImageUpload,
}: DualEditorProps) {
  const [mode, setMode] = useState<"markdown" | "wysiwyg">(
    storeAs === "markdown" ? "markdown" : "wysiwyg",
  );
  const [initial] = useState(() => {
    if (storeAs === "markdown") {
      const markdown = initialMarkdown ?? htmlToMarkdown(initialHtml ?? "");
      return { markdown, html: markdownToHtml(markdown) };
    }
    const html = initialHtml ?? markdownToHtml(initialMarkdown ?? "");
    return { html, markdown: initialMarkdown ?? htmlToMarkdown(html) };
  });
  const [html, setHtml] = useState(initial.html);
  const [markdown, setMarkdown] = useState(initial.markdown);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingInsertRef = useRef<((image: UploadedImage) => void) | null>(
    null,
  );

  const handleHtmlChange = (value: string, fromUser: boolean) => {
    setHtml(value);
    // Quill normalising loaded content is not an edit: leave the markdown
    // (and the parent's copy) as they were.
    if (!fromUser) return;
    const md = htmlToMarkdown(value);
    setMarkdown(md);
    onChange({ html: value, markdown: md });
  };

  const handleMarkdownChange = (value: string) => {
    const h = markdownToHtml(value);
    setMarkdown(value);
    setHtml(h);
    onChange({ html: h, markdown: value });
  };

  const pickPicture = (insert: (image: UploadedImage) => void) => {
    pendingInsertRef.current = insert;
    setUploadError(null);
    fileInputRef.current?.click();
  };

  /** Upload `file` and hand the result to `insert`, showing any error. */
  const uploadPicture = async (
    file: File,
    insert: (image: UploadedImage) => void,
  ) => {
    if (!onImageUpload) return;
    setUploadError(null);
    setUploading(true);
    try {
      insert(await onImageUpload(file));
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed — try again",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    const insert = pendingInsertRef.current;
    input.value = "";
    pendingInsertRef.current = null;
    if (!file || !insert) return;
    await uploadPicture(file, insert);
  };

  const insertPictureCommand: ICommand = {
    name: "insert-picture",
    keyCommand: "insert-picture",
    buttonProps: { "aria-label": "Insert picture", title: "Insert picture" },
    icon: <span className="text-xs font-bold">IMG</span>,
    execute: (_state, api: TextAreaTextApi) => {
      pickPicture((image) => api.replaceSelection(pictureMarkdown(image)));
    },
  };

  const markdownCommands = useMemo(
    () => [
      commands.group(
        [
          commands.heading1, // # H1
          commands.heading2, // ## H2
          commands.heading3, // ### H3
        ],
        {
          name: "headers",
          groupName: "headers",
          buttonProps: { title: "Headers" },
        },
      ),
      commands.bold,
      commands.italic,
      commands.strikethrough,
      underlineCommand,
      commands.divider,
      commands.link,
      commands.code,
      commands.codeBlock,
      commands.quote,
      commands.divider,
      commands.unorderedListCommand,
      commands.orderedListCommand,
      commands.divider,
      commands.hr,
    ],
    [],
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {mode === "markdown" ? (
        <div style={{ fontSize: "16px" }}>
          <MDEditor
            value={markdown}
            onChange={(v = "") => handleMarkdownChange(v)}
            previewOptions={{
              rehypePlugins: [[rehypeSanitize]],
            }}
            height={600}
            style={{ fontSize: "16px" }}
            commands={
              onImageUpload
                ? [...markdownCommands, commands.divider, insertPictureCommand]
                : markdownCommands
            }
          />
        </div>
      ) : (
        <div style={{ fontSize: "16px" }}>
          <QuillEditor
            value={html}
            onChange={handleHtmlChange}
            onInsertPicture={onImageUpload ? pickPicture : undefined}
            onUploadPicture={onImageUpload ? uploadPicture : undefined}
          />
        </div>
      )}
      {onImageUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      )}
      {uploading && <p className="text-sm text-gray-600">Uploading picture…</p>}
      {uploadError && (
        <p role="alert" className="text-sm text-red-600">
          {uploadError}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("markdown")}
          className={modeButtonClass(mode === "markdown")}
        >
          Markdown
        </button>
        <button
          type="button"
          onClick={() => setMode("wysiwyg")}
          className={modeButtonClass(mode === "wysiwyg")}
        >
          WYSIWYG
        </button>
      </div>
    </div>
  );
}
