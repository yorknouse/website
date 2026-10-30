import { decodeHTML } from "entities";

// Kept apart from content.ts so the client-side schema can use it without
// bundling the HTML sanitiser and markdown renderer.

/** Plain-text field -> stored form (matches HTMLPurifier output from PHP). */
export function escapeText(s: string): string {
  // Strip until nothing changes, so removing one tag can't join the text
  // around it into another (e.g. "<scr<b>ipt>").
  let stripped = s.trim();
  let previous: string;
  do {
    previous = stripped;
    stripped = stripped
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<!--|-->/g, "")
      .replace(/<\/?[a-zA-Z][^>]*>/g, "");
  } while (stripped !== previous);
  return decodeHTML(stripped)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Stored plain field -> value for an input. */
export function decodeText(s: string | null): string {
  return s ? decodeHTML(s) : "";
}
