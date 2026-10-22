import { decodeHTML } from "entities";

// Kept apart from content.ts so the client-side schema can use it without
// bundling the HTML sanitiser and markdown renderer.

/** Plain-text field -> stored form (matches HTMLPurifier output from PHP). */
export function escapeText(s: string): string {
  const stripped = s
    .trim()
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "");
  return decodeHTML(stripped)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Stored plain field -> value for an input. */
export function decodeText(s: string | null): string {
  return s ? decodeHTML(s) : "";
}
