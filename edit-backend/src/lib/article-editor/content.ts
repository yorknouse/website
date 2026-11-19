import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export { decodeText, escapeText } from "./text";

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

/**
 * The article.twig:343 substitutions, except "PS" -> "&pound;": that rewrote
 * words like "GPS" and saved them back. Legacy "PS" pound signs are left as
 * written and need converting separately.
 */
export function legacyHtmlForEditor(
  html: string | null,
  archiveUrl: string,
): string {
  return (html ?? "")
    .replaceAll("\n", "<br/>")
    .replaceAll("[ARCHIVECDNURL]", archiveUrl);
}
