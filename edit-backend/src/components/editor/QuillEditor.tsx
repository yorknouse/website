"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import Quill, { type EmitterSource } from "quill";
import { Delta } from "quill/core";
import "react-quill-new/dist/quill.snow.css";
import {
  DEFAULT_CAPTION,
  DEFAULT_FIGURE_STYLE,
  type FigureValue,
  getStyleProperty,
  registerArticleFormats,
  setStyleProperty,
} from "@/components/editor/quillFormats";

registerArticleFormats();

export interface UploadedImage {
  id: number;
  url: string;
}

interface QuillEditorProps {
  value: string;
  /** `fromUser` is false for Quill's own normalisation of loaded content. */
  onChange: (html: string, fromUser: boolean) => void;
  /** Asks the parent to pick and upload a picture, then calls `insert`. */
  onInsertPicture?: (insert: (image: UploadedImage) => void) => void;
  /** Uploads a dropped or pasted picture, then calls `insert`. */
  onUploadPicture?: (
    file: File,
    insert: (image: UploadedImage) => void,
  ) => void;
}

/** Image types the upload API accepts (see EXTENSION_TO_MIME). */
const PICTURE_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/** Insert an uploaded picture as `<img src data-fileid>` at `index`. */
function insertImageAt(quill: Quill, index: number, image: UploadedImage) {
  quill.updateContents(
    new Delta()
      .retain(index)
      .insert({ image: image.url }, { "data-fileid": String(image.id) }),
    "user",
  );
  quill.setSelection(index + 1, 0, "silent");
}

type ImageAttributes = Record<string, string>;

type SelectedImage =
  | { index: number; kind: "image"; src: string; attributes: ImageAttributes }
  | { index: number; kind: "figure"; value: FigureValue };

const SIZES = ["100%", "50%", "25%"] as const;
const FLOATS = [
  { label: "Float left", value: "left" },
  { label: "Float right", value: "right" },
  { label: "No float", value: null },
] as const;

/** The image or figure embed at `index`, if there is one. */
function readImageAt(quill: Quill, index: number): SelectedImage | null {
  if (index < 0) return null;
  const op = quill.getContents(index, 1).ops[0];
  if (!op || typeof op.insert !== "object" || op.insert === null) return null;
  const insert = op.insert as Record<string, unknown>;
  if (typeof insert.image === "string") {
    return {
      index,
      kind: "image",
      src: insert.image,
      attributes: { ...((op.attributes ?? {}) as ImageAttributes) },
    };
  }
  if (insert.figure && typeof insert.figure === "object") {
    return { index, kind: "figure", value: insert.figure as FigureValue };
  }
  return null;
}

function styleOf(image: SelectedImage): string | undefined {
  return image.kind === "image" ? image.attributes.style : image.value.style;
}

const toolButtonClass = (active: boolean) =>
  `px-2 py-1 rounded text-sm ${
    active ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
  }`;

export default function QuillEditor({
  value,
  onChange,
  onInsertPicture,
  onUploadPicture,
}: QuillEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  // True while the image tools edit, so their changes keep the selection.
  const editingImageRef = useRef(false);
  const insertPictureRef = useRef(onInsertPicture);
  insertPictureRef.current = onInsertPicture;
  const uploadPictureRef = useRef(onUploadPicture);
  uploadPictureRef.current = onUploadPicture;
  const hasPicture = Boolean(onInsertPicture);

  const getQuill = () => quillRef.current?.getEditor() ?? null;

  const insertPicture = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    insertPictureRef.current?.((image) => {
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength() - 1;
      insertImageAt(quill, index, image);
    });
  }, []);

  /**
   * Quill's own uploader inlines dropped/pasted files as data: URLs, which
   * the sanitiser strips on save. Upload them instead (or ignore them when
   * there is nowhere to upload to).
   */
  const uploadDropped = useCallback(function (
    this: { quill: Quill },
    range: { index: number },
    files: File[],
  ) {
    const quill = this.quill;
    const upload = uploadPictureRef.current;
    if (!upload) return;
    let index = range.index;
    files.forEach((file) =>
      upload(file, (image) => {
        insertImageAt(quill, Math.min(index, quill.getLength() - 1), image);
        index += 1;
      }),
    );
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          ["link", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          ...(hasPicture ? [["image"]] : []),
          ["clean"],
        ],
        handlers: { image: insertPicture },
      },
      uploader: { mimetypes: PICTURE_MIMETYPES, handler: uploadDropped },
    }),
    [hasPicture, insertPicture, uploadDropped],
  );

  // Label the picture button and select images when they are clicked.
  useEffect(() => {
    const quill = getQuill();
    if (!quill) return;
    const toolbar = quill.getModule("toolbar") as {
      container?: HTMLElement;
    } | null;
    const button = toolbar?.container?.querySelector("button.ql-image");
    button?.setAttribute("aria-label", "Insert picture");
    button?.setAttribute("title", "Insert picture");

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const node =
        target.closest("figure") ?? (target.tagName === "IMG" ? target : null);
      const blot = node ? Quill.find(node) : null;
      if (!node || !blot || blot instanceof Quill) {
        setSelected(null);
        return;
      }
      setSelected(readImageAt(quill, quill.getIndex(blot)));
    };
    // Any other edit may move the image, so drop the selection.
    const onTextChange = () => {
      if (!editingImageRef.current) setSelected(null);
    };
    quill.root.addEventListener("click", onClick);
    quill.on("text-change", onTextChange);
    return () => {
      quill.root.removeEventListener("click", onClick);
      quill.off("text-change", onTextChange);
    };
  }, [modules]);

  /** Run an image tool edit on the currently selected image. */
  const editSelected = (
    edit: (quill: Quill, current: SelectedImage) => void,
  ) => {
    const quill = getQuill();
    const current = quill && selected && readImageAt(quill, selected.index);
    if (!quill || !current) return;
    editingImageRef.current = true;
    try {
      edit(quill, current);
    } finally {
      editingImageRef.current = false;
    }
  };

  /** Re-read the selected image after an edit (it may have moved by one). */
  const reselect = (
    quill: Quill,
    index: number,
    kind: SelectedImage["kind"],
  ) => {
    for (const i of [index, index + 1]) {
      const found = readImageAt(quill, i);
      if (found?.kind === kind) {
        setSelected(found);
        return;
      }
    }
    setSelected(null);
  };

  const replaceFigure = (quill: Quill, index: number, value: FigureValue) => {
    quill.updateContents(
      new Delta().retain(index).delete(1).insert({ figure: value }),
      "user",
    );
    reselect(quill, index, "figure");
  };

  const setStyle = (prop: "width" | "float", propValue: string | null) =>
    editSelected((quill, current) => {
      const style = setStyleProperty(styleOf(current), prop, propValue);
      if (current.kind === "image") {
        quill.formatText(current.index, 1, "style", style || false, "user");
        reselect(quill, current.index, "image");
      } else {
        replaceFigure(quill, current.index, {
          ...current.value,
          style: style || undefined,
        });
      }
    });

  const addCaption = () =>
    editSelected((quill, current) => {
      if (current.kind !== "image") return;
      const { "data-fileid": fileid, style, alt } = current.attributes;
      const figure: FigureValue = {
        src: current.src,
        caption: DEFAULT_CAPTION,
        figureStyle: DEFAULT_FIGURE_STYLE,
      };
      if (alt) figure.alt = alt;
      if (fileid) figure.fileid = fileid;
      if (style) figure.style = style;
      // An image alone on its line takes the line's place rather than
      // leaving an empty paragraph behind.
      const [line] = quill.getLine(current.index);
      const remove = line && line.length() === 2 && line.next ? 2 : 1;
      quill.updateContents(
        new Delta().retain(current.index).delete(remove).insert({ figure }),
        "user",
      );
      reselect(quill, current.index, "figure");
    });

  const removeCaption = () =>
    editSelected((quill, current) => {
      if (current.kind !== "figure") return;
      const attributes: ImageAttributes = {};
      if (current.value.alt) attributes.alt = current.value.alt;
      if (current.value.fileid)
        attributes["data-fileid"] = current.value.fileid;
      if (current.value.style) attributes.style = current.value.style;
      quill.updateContents(
        new Delta()
          .retain(current.index)
          .delete(1)
          .insert({ image: current.value.src }, attributes)
          .insert("\n"),
        "user",
      );
      reselect(quill, current.index, "image");
    });

  const setCaption = (caption: string) =>
    editSelected((quill, current) => {
      if (current.kind !== "figure") return;
      replaceFigure(quill, current.index, { ...current.value, caption });
    });

  const handleChange = (
    html: string,
    _delta: unknown,
    source: EmitterSource,
  ) => {
    onChange(html, source === "user");
  };

  const width = selected ? getStyleProperty(styleOf(selected), "width") : null;
  const float = selected ? getStyleProperty(styleOf(selected), "float") : null;

  return (
    <div>
      {selected && (
        <div
          role="toolbar"
          aria-label="Image tools"
          className="flex flex-wrap items-center gap-2 mb-2 p-2 border rounded bg-gray-50"
        >
          <span className="text-sm font-semibold">Image:</span>
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={toolButtonClass(width === size)}
              onClick={() => setStyle("width", size)}
            >
              {size}
            </button>
          ))}
          <span className="mx-1 text-gray-400">|</span>
          {FLOATS.map((f) => (
            <button
              key={f.label}
              type="button"
              className={toolButtonClass(float === f.value)}
              onClick={() => setStyle("float", f.value)}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-1 text-gray-400">|</span>
          {selected.kind === "image" ? (
            <button
              type="button"
              className={toolButtonClass(false)}
              onClick={addCaption}
            >
              Add caption
            </button>
          ) : (
            <>
              <label className="text-sm flex items-center gap-1">
                Caption
                <input
                  type="text"
                  className="border rounded px-2 py-1 text-sm"
                  value={selected.value.caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </label>
              <button
                type="button"
                className={toolButtonClass(false)}
                onClick={removeCaption}
              >
                Remove caption
              </button>
            </>
          )}
        </div>
      )}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        modules={modules}
        onChange={handleChange}
      />
    </div>
  );
}
