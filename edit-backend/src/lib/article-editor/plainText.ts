import { decodeHTML } from "entities";
import sanitizeHtml from "sanitize-html";
import { escapeText } from "./text";

// Server only: sanitize-html must stay out of the client bundle (see text.ts).

// The parser treats "<" before a letter as a tag even if it never closes, and
// would drop the rest of the text, so "Profits<Costs say experts" needs this.
const UNCLOSED_BRACKET = /<(?![^<>]*>)/g;

/** Plain-text field -> stored form, with any tags and comments removed. */
export function cleanText(s: string): string {
  const stripped = sanitizeHtml(s.replace(UNCLOSED_BRACKET, "&lt;"), {
    allowedTags: [],
    allowedAttributes: {},
  });
  return escapeText(stripped);
}

/**
 * Stored plain field -> text to show. Also removes tags, because the PHP site
 * kept safe ones. The result is not HTML-safe: it relies on being escaped when
 * rendered, so it must never reach set:html or innerHTML.
 */
export function displayText(s: string | null | undefined): string {
  return s ? decodeHTML(cleanText(s)) : "";
}
