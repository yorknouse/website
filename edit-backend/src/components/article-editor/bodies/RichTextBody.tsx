"use client";

import DualEditor from "@/components/Editor";
import { uploadFile } from "@/lib/uploadClient";
import FieldError from "../FieldError";

interface RichTextBodyProps {
  /** 1 stores HTML, 6 stores markdown. */
  type: 1 | 6;
  initialHtml?: string;
  initialMarkdown?: string;
  articleId?: number;
  onChange: (body: { html: string } | { markdown: string }) => void;
  error?: string;
}

export default function RichTextBody({
  type,
  initialHtml,
  initialMarkdown,
  articleId,
  onChange,
  error,
}: RichTextBodyProps) {
  const storeAs = type === 1 ? "html" : "markdown";
  return (
    <div>
      <DualEditor
        initialHtml={initialHtml}
        initialMarkdown={initialMarkdown}
        storeAs={storeAs}
        onChange={(v) =>
          onChange(
            storeAs === "html" ? { html: v.html } : { markdown: v.markdown },
          )
        }
        onImageUpload={(file) => uploadFile(file, 2, articleId ?? 0)}
      />
      <FieldError message={error} />
    </div>
  );
}
