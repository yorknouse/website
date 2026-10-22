import Quill from "quill";
import Image from "quill/formats/image";
import { BlockEmbed } from "quill/blots/block";
import Clipboard from "quill/modules/clipboard";
import type { Range } from "quill";

/**
 * Quill formats for article images. These keep the markup the old Summernote
 * editor produced (and the content sanitiser allows):
 *   <img src="…" data-fileid="N" style="width: 50%; float: left;">
 *   <figure><img …><figcaption>Photo Credit: …</figcaption></figure>
 */

export const DEFAULT_CAPTION = "Photo Credit: ";

const IMAGE_ATTRIBUTES = ["alt", "height", "width", "data-fileid", "style"];

/** Inline image that also keeps `data-fileid` and `style`. */
export class ArticleImage extends Image {
  static formats(domNode: Element): Record<string, string | null> {
    return IMAGE_ATTRIBUTES.reduce<Record<string, string | null>>(
      (formats, attribute) => {
        if (domNode.hasAttribute(attribute)) {
          formats[attribute] = domNode.getAttribute(attribute);
        }
        return formats;
      },
      {},
    );
  }

  format(name: string, value: string) {
    if (IMAGE_ATTRIBUTES.includes(name)) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}

export interface FigureValue {
  src: string;
  alt?: string;
  fileid?: string;
  style?: string;
  caption: string;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Captioned image: a block-level `<figure>` holding the image and caption. */
export class ArticleFigure extends BlockEmbed {
  static blotName = "figure";
  static tagName = "FIGURE";

  declare domNode: HTMLElement;

  static create(value: FigureValue) {
    const node = super.create(value) as HTMLElement;
    // The caption is edited through the image tools, not typed in place.
    node.setAttribute("contenteditable", "false");
    const img = document.createElement("img");
    img.setAttribute("src", Image.sanitize(value.src));
    if (value.alt) img.setAttribute("alt", value.alt);
    if (value.fileid) img.setAttribute("data-fileid", value.fileid);
    if (value.style) img.setAttribute("style", value.style);
    const caption = document.createElement("figcaption");
    caption.textContent = value.caption;
    node.appendChild(img);
    node.appendChild(caption);
    return node;
  }

  static value(domNode: HTMLElement): FigureValue {
    const img = domNode.querySelector("img");
    const value: FigureValue = {
      src: img?.getAttribute("src") ?? "",
      caption: domNode.querySelector("figcaption")?.textContent ?? "",
    };
    const alt = img?.getAttribute("alt");
    const fileid = img?.getAttribute("data-fileid");
    const style = img?.getAttribute("style");
    if (alt) value.alt = alt;
    if (fileid) value.fileid = fileid;
    if (style) value.style = style;
    return value;
  }

  /** Clean markup for Quill's getSemanticHTML (no contenteditable). */
  html() {
    const value = ArticleFigure.value(this.domNode);
    let img = `<img src="${escapeAttribute(value.src)}"`;
    if (value.alt) img += ` alt="${escapeAttribute(value.alt)}"`;
    if (value.fileid) img += ` data-fileid="${escapeAttribute(value.fileid)}"`;
    if (value.style) img += ` style="${escapeAttribute(value.style)}"`;
    img += ">";
    return `<figure>${img}<figcaption>${escapeText(value.caption)}</figcaption></figure>`;
  }
}

/** PHP `pasteBefore`: replace every `<span>` with its text. */
export function stripSpans(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("span").forEach((span) => {
    span.replaceWith(doc.createTextNode(span.textContent ?? ""));
  });
  return doc.body.innerHTML;
}

class ArticleClipboard extends Clipboard {
  onPaste(range: Range, data: { text?: string; html?: string }) {
    super.onPaste(range, {
      text: data.text,
      html: data.html ? stripSpans(data.html) : data.html,
    });
  }
}

let registered = false;

export function registerArticleFormats() {
  if (registered) return;
  registered = true;
  Quill.register(
    {
      "formats/image": ArticleImage,
      "formats/figure": ArticleFigure,
      "modules/clipboard": ArticleClipboard,
    },
    true,
  );
}

/** Parse an inline style attribute into ordered property/value pairs. */
function parseStyle(style: string | null | undefined): Map<string, string> {
  const map = new Map<string, string>();
  (style ?? "").split(";").forEach((part) => {
    const i = part.indexOf(":");
    if (i === -1) return;
    const prop = part.slice(0, i).trim().toLowerCase();
    const val = part.slice(i + 1).trim();
    if (prop && val) map.set(prop, val);
  });
  return map;
}

/**
 * Return `style` with `prop` set to `value` (or removed when null), written
 * as "width: 50%; float: left;".
 */
export function setStyleProperty(
  style: string | null | undefined,
  prop: "width" | "float",
  value: string | null,
): string {
  const map = parseStyle(style);
  if (value === null) {
    map.delete(prop);
  } else {
    map.set(prop, value);
  }
  return Array.from(map, ([p, v]) => `${p}: ${v};`).join(" ");
}

export function getStyleProperty(
  style: string | null | undefined,
  prop: "width" | "float",
): string | null {
  return parseStyle(style).get(prop) ?? null;
}
