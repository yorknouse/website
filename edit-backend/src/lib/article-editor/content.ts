import { decodeHTML } from "entities";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** Plain-text field -> stored form (matches HTMLPurifier output from PHP). */
export function escapeText(s: string): string {
  const decoded = decodeHTML(s.trim());
  return decoded
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Stored plain field -> value for an input. */
export function decodeText(s: string | null): string {
  return s ? decodeHTML(s) : "";
}

const anyValue = [/^.*$/];

export function sanitiseBodyHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "sub",
      "sup",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "figure",
      "figcaption",
      "img",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "data-fileid", "style"],
      figure: ["style", "class"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class"],
    },
    allowedStyles: {
      "*": {
        width: anyValue,
        float: anyValue,
        "text-align": anyValue,
        color: anyValue,
        "background-color": anyValue,
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

export function renderMarkdown(md: string): string {
  return sanitiseBodyHtml(marked.parse(md, { async: false }));
}

/** Mirrors the substitutions at article.twig:343, in order. */
export function legacyHtmlForEditor(
  html: string | null,
  archiveUrl: string,
): string {
  return (html ?? "")
    .replaceAll('"PS"', "&pound;")
    .replaceAll("\n", "<br/>")
    .replaceAll("[ARCHIVECDNURL]", archiveUrl);
}
