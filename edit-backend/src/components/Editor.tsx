"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "react-quill-new/dist/quill.snow.css";
import rehypeSanitize from "rehype-sanitize";
import { marked as markdownToHtml } from "marked";
import TurndownService from "turndown";
import * as commands from "@uiw/react-md-editor";
import { ICommand } from "@uiw/react-md-editor";

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
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface EditorProps<T = void> {
  /** Any element (button, icon, etc.) that triggers the modal */
  // children: ReactNode;

  /** Optional confirmation message */
  // message?: string;
  //
  // /** Optional modal title */
  // title?: string;

  initialMarkdown?: string;

  /** Optional callback to run on confirm */
  onSubmit?: (data?: T) => void | Promise<void>;

  /** Optional data to pass into onConfirm */
  confirmData?: T;

  // /** Optional route to redirect to on confirm */
  // redirectTo?: string;
  //
  // /** Optional Tailwind classes for modal buttons */
  // confirmButtonClassName?: string;
  // cancelButtonClassName?: string;
}

export default function DualEditor<T = void>({
  initialMarkdown = "",
  onSubmit,
  confirmData,
}: EditorProps<T>) {
  const [mode, setMode] = useState<"markdown" | "wysiwyg">("wysiwyg");
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [html, setHtml] = useState(markdownToHtml(markdown).toString());

  // Turndown service configured once
  const turndown = useMemo(() => {
    const t = new TurndownService({
      headingStyle: "atx", // '# Header'
      bulletListMarker: "-", // '-' instead of '*'
      emDelimiter: "*", // '*italic*' instead of '_italic_'
      strongDelimiter: "**", // '**bold**' instead of '__bold__'
      codeBlockStyle: "fenced", // triple backticks for code
    });
    t.use(require("turndown-plugin-gfm").gfm);
    // Optionally tune rules, e.g. force <b> -> ** rather than __, etc.
    return t;
  }, []);

  // When switching to the WYSIWYG mode, convert markdown -> html once
  useEffect(() => {
    if (mode === "wysiwyg") {
      const htmlFromMd = markdownToHtml.parse(markdown || "");
      if (typeof htmlFromMd === "string") {
        setHtml(htmlFromMd);
        return;
      }
      htmlFromMd.then((h) => {
        setMarkdown(h);
      });
    }
  }, [mode, markdown]);

  // When switching *to* the Markdown mode, convert html -> markdown once
  useEffect(() => {
    if (mode === "markdown") {
      try {
        // convert to markdown into a local const first
        const converted = turndown.turndown(html || "");
        // normalize blank lines between block elements:
        const normalized = converted
          // replace 3+ newlines with exactly 2
          .replace(/\n{3,}/g, "\n\n")
          // trim trailing/leading whitespace
          .trim();

        // log the exact converted output (useful for debugging)
        console.log("HTML ->", html);
        console.log("Converted Markdown ->", normalized);

        // then set state once
        setMarkdown(normalized);
      } catch (err) {
        console.warn("Conversion failed:", err);
      }
    }
    // We only depend on mode and html here: when html changes & mode === markdown, conversion occurs
  }, [mode, html, turndown]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {mode === "markdown" ? (
        <div style={{ fontSize: "16px" }}>
          <MDEditor
            value={markdown}
            onChange={(v = "") => setMarkdown(v)}
            previewOptions={{
              rehypePlugins: [[rehypeSanitize]],
            }}
            height={600}
            style={{ fontSize: "16px" }}
            commands={[
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
            ]}
          />
        </div>
      ) : (
        <div style={{ fontSize: "16px" }}>
          <ReactQuill
            theme="snow"
            value={html}
            onChange={(v = "") => setHtml(v)}
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("markdown")}
          className={`px-3 py-1 rounded ${
            mode === "markdown" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Markdown
        </button>
        <button
          onClick={() => setMode("wysiwyg")}
          className={`px-3 py-1 rounded ${
            mode === "wysiwyg" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          WYSIWYG
        </button>
      </div>
    </div>
  );
}
