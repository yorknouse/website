import { decodeHTML } from "entities";

// Kept apart from content.ts so the client-side schema can use it without
// bundling the HTML sanitiser and markdown renderer.

/** Escapes text for storage. Use cleanText to save a field: it strips tags too. */
export function escapeText(s: string): string {
  const normalized = decodeHTML(s.trim());
  return normalized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Stored plain field -> value for an input. */
export function decodeText(s: string | null): string {
  return s ? decodeHTML(s) : "";
}
