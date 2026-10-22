import { createHash } from "node:crypto";
import { hostname } from "node:os";
import { formatUk } from "../ukTime";

/** Readers-site URL of an article; the date parts are the stored UTC date. */
export function articlePermalink(publishedUtc: Date, slug: string): string {
  const y = publishedUtc.getUTCFullYear();
  const m = String(publishedUtc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(publishedUtc.getUTCDate()).padStart(2, "0");
  return `${process.env.FRONTEND_URL}articles/${y}/${m}/${d}/${slug}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function utcStamp(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * York SU Media Charter notification, worded as coreHead.php yorkSUNotify.
 * headline and excerpt are plain (decoded) text.
 */
export function yorkSuEmailHtml(
  a: {
    headline: string;
    excerpt: string;
    publishedUtc: Date;
    slug: string;
    articleId: number;
  },
  now: Date,
): string {
  const future = a.publishedUtc.getTime() > now.getTime();
  const link = articlePermalink(a.publishedUtc, a.slug);
  let html =
    "You are receiving this email as a notification of a new article being uploaded to the Nouse.co.uk website in compliance with section 5.3 of the York SU Media Charter.<br/><br/>";
  if (future) {
    html += `This article will be published at ${formatUk(a.publishedUtc)} UK time and this email is an advanced notification of publication. No further notifications will follow and this article will be automatically published.<br/><br/>`;
  }
  html += `<b>Headline: </b>${escapeHtml(a.headline)}<br/>`;
  html += `<b>Excerpt: </b>${escapeHtml(a.excerpt)}<br/>`;
  if (future) {
    const key = createHash("md5").update(String(a.articleId)).digest("hex");
    html += `This article hasn't been published yet, so it's not accessible on our website. A secret link has been generated for you to preview it, but please don't share this externally: <a href='${link}?key=${key}'>${link}</a>`;
  } else {
    html += `<b>Link to article: </b><a href='${link}'>${link}</a>`;
  }
  html += `<br/><br/><br/>If you have any questions about this notification please do not hesitate to contact us on support@nouse.co.uk.<br/>For queries relating to this article itself (for example concerns about its content) please contact editor@nouse.co.uk. <br/><br/><br/>Nouse Technical Team<br/><i>${hostname()} (compliance tracked at  ${utcStamp(now)} UTC)</i>`;
  return html;
}
