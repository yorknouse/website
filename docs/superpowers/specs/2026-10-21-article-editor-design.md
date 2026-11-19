# Article create/edit in edit-backend (replacing PHP admin)

Date: 2026-10-21
Status: Approved 2026-10-21

## Why

The PHP admin (`html/admin/article.php`, `article.twig`, `api/article/*`) is ~9 years old and
is being phased out entirely. New Nouse developers know frontend stacks (React/Astro/Svelte),
not PHP, so every PHP feature needs to live in `edit-backend` (Next.js) instead.

The biggest user-facing pain today: **saving gives no useful errors.** Any failure,
including a missing field, shows "check your internet connection". Select2 dropdowns
(sections, categories, authors) were also unreliable.

## Goals

- Recreate **every feature and every field** of the PHP article create/edit page in
  edit-backend, for article types 1, 2, 5 and 6 (type 4 Liveblogpro is deferred, see Non-goals).
- Field-level error messages: every validation problem is reported against the field it
  belongs to, and the server returns structured errors, not a generic failure.
- A modern API: JSON in and out, validated with zod, not shaped by the old PHP endpoints.
- Move the PHP side-effects (cache purge, social posting, York SU notification, audit log,
  the article cron) into edit-backend so PHP can be switched off.
- Code a frontend-leaning developer can read and extend.

## Non-goals

- Changing the database schema or storage format. Writes must stay byte-compatible with what
  the PHP wrote, because the readers frontend (`edit-backend/src/app/api/frontend/*`, consumed
  by `readers-frontend`) already reads that format.
- Redesigning the articles list page (it exists already) beyond adding a "New article" entry.
- **Type 4 (Liveblogpro)**: no articles created in years; deferred as a "maybe later" item.
  Not offered in the "New article" type picker. Existing type 4 articles open with their metadata
  fields editable and a read-only notice in place of the body editor (body left untouched on save).
- New editorial features that didn't exist in PHP (e.g. scheduling UI, collaborative editing).

## Anti-goals (failure even if it "works")

- Any save failure that shows a generic message when the real cause is known.
- Data written in a shape the readers site renders differently from a PHP-saved article.
- Losing a field or behaviour editors relied on, even a minor one (e.g. the "display images"
  legal toggle, thumbnail credit prompts, unsaved-changes warning).

## Constraints

- Stack already in edit-backend: Next.js 16 (app router), React 19, next-auth, Prisma (MySQL),
  zod 4, Tailwind, S3 presigned uploads (`/api/backend/uploads/sign` + `/complete`), Redis
  cache (`src/lib/cache.ts`), nodemailer, Playwright e2e tests in `e2e-tests/`.
- Permissions use the existing action numbers via `checkUserPermissions` /
  `GetUserData` in `src/lib/auth.ts`: **31 = create, 32 = edit/view, 33 = delete**.
- Existing pieces to build on: `DualEditor` (`src/components/Editor.tsx`, Quill WYSIWYG +
  markdown with an `onChange` prop), the WIP `ArticleForm`, `AuthorMultiSelect`,
  `ArticlePreviewButton`, `ArticleDeleteButton`, `ConfirmAction`, `src/lib/auditLog.ts`.
  The WIP `/api/backend/article` route and `articles/new` placeholder are to be replaced.

## What the PHP page does today (the feature inventory)

One page handles create (`article.php?type=N`) and edit (`article.php?id=N`).

### Fields

| Field | DB column | Notes |
|---|---|---|
| Headline | `articlesDrafts_headline` | Required. |
| Strapline | `articlesDrafts_excerpt` | Optional. |
| Publication date/time | `articles_published` | Defaults to now. Future date + Published = scheduled. Helper text: may take up to 2h to appear due to caching. |
| Status | `articles_showInLists` / `showInSearch` / `showInAdmin` | Draft = 0/0/1, Search only = 0/1/1, Published = 1/1/1. |
| Edition | `editions_id` | Optional; list of non-deleted editions, newest first, labelled `name (Number N)`. |
| Print page number | `articles_editionPage` | Free text, optional. |
| Sections | `articlesCategories` | Top-level public categories. |
| Categories | `articlesCategories` | Sub-categories (up to 2 levels deep) grouped under their parent. Sections + categories are stored together in one join table. |
| Authors | `articlesAuthors` | Any non-deleted user. Blank allowed (editorials). |
| Drop capital | `articles_dropCapital` | Checkbox. |
| Post to Facebook / Twitter | `articles_socialConfig` | See social config below. Default on for new articles. Disabled + "Posted" once posted. |
| Social excerpt | `articles_socialExcerpt` | Max 280 chars. Disabled once posted to both. |
| Display images in article | `articles_displayImages` | Default on. Help text + link to `https://nouse.co.uk/imageRemoval` (legal uncertainty). |
| Thumbnail is portrait | `articles_isThumbnailPortrait` | Checkbox. |
| Slug | `articles_slug` | Auto-generated from headline on create only, then read-only. "Contact support@nouse.co.uk for a custom URL". |
| Thumbnail | `articles_thumbnail` | s3files id; default thumbnail is id `1`. Uploaded as type 3 (ARTICLE-THUMBNAIL). Guidance: landscape ~2:1. |
| Thumbnail credit | `articlesDrafts_thumbnailCredit` | Shown once a non-default thumbnail is set. |
| Body | depends on type, see below | |

### Article types (`articles_type`)

| Type | Name | Body editor | Stored as |
|---|---|---|---|
| 1 | Standard (HTML) | Rich text editor with image insert | `articlesDrafts_text` = HTML |
| 6 | Markdown | Markdown/WYSIWYG editor with image insert | `articlesDrafts_markdown` = markdown **and** `articlesDrafts_text` = rendered HTML |
| 2 | Gallery | Grid of uploaded images, remove image, click to edit caption | `articlesDrafts_text` = comma-separated s3files ids; captions saved to `s3files.s3files_meta_caption` |
| 4 | Liveblogpro | Checklist of steps + textarea for the "premium embed" code | `articlesDrafts_text` = embed HTML |
| 5 | Print edition | Checklist + "Embed URL" input (issuu / filestore link) | `articlesDrafts_text` = URL |

Type 1 content in PHP has `PS` replaced by `&pound;`, `\n` by `<br/>` and `[ARCHIVECDNURL]`
by the archive filestore URL when loading into the editor. The new editor must load old
content with the same substitutions so legacy articles still look right.

Inline images (types 1 and 6) are uploaded as s3files type 2 (ARTICLE-IMAGE), subType = article id
(0 for unsaved), then inserted into the body (HTML `<img data-fileid=…>` for type 1; markdown
`![id](url)` for type 6). Type 1 also supported image size (100/50/25%), float left/right/none and
"caption it" (adds a figcaption defaulting to "Photo Credit: ").

### Header actions

- **Delete** (permission 33, only if `showInAdmin`): confirmation, then soft delete
  (`showInAdmin/showInSearch/showInLists` = 0), audit log `DELETE`, cache purge, back to list.
- **View on site** (if published and date in past): `{FRONTEND_URL}/articles/YYYY/MM/DD/{slug}`.
- **Stats** (same condition): Grafana link (already built on the list page).
- **Preview on site** (otherwise, for saved articles): existing `ArticlePreviewButton`.

### Saved versions

Every save inserts a **new** `articlesDrafts` row (never updates). The page lists all drafts
newest first: `v{id}`, timestamp, changelog, author name. The latest draft is the current content.

### Pre-save checks (client side, in this order)

1. Headline present.
2. Slug present (create only).
3. If thumbnail is still the default (id 1): confirm "You haven't set a thumbnail…".
4. If a non-default thumbnail has no credit: confirm "Please confirm that no credit is required -
   if you are unsure please consult a senior editor" (button: "No credit required").
5. If a non-default thumbnail and type ≠ 6: confirm the thumbnail is credited in the body
   (button: "Thumbnail credited in body of article").

Plus an unsaved-changes warning when leaving the page.

### What saving does on the server

**Create** (permission 31):
- Insert `articles` (slug, type, all article fields, socialConfig from the toggles, starting from
  `1,0,1,0`), then the first `articlesDrafts` row, `articlesCategories`, `articlesAuthors`.
- If published date ≤ now and status makes it searchable: York SU notify, social post now.
- Audit log `CREATE`. Cache purge for the edition page and each category page.
- Redirect to the edit page for the new id.

**Edit** (permission 32):
- Update `articles` (slug and type never change), insert a new draft, sync categories and authors
  (remove missing, add new).
- Social toggles only change if that platform hasn't posted yet.
- Post to social now if: published date ≤ now and toggled on and not yet posted (including when
  an article goes from not-searchable to searchable).
- Audit log `EDIT`. Cache purge for the article URL, edition page and category pages.

### Social config (`articles_socialConfig`)

Comma-separated 4-tuple `fb_wanted,fb_posted,tw_wanted,tw_posted` (e.g. `1,0,1,0`). Posting is via
IFTTT webhooks (`https://maker.ifttt.com/trigger/socialMediaAutomationFB|Twitter/with/key/{IFTTT}`,
form body `value1=excerpt&value2=permalink&value3=null`). The excerpt is socialExcerpt, else
strapline, else headline. Mark the posted flag on success.

### York SU notification (media charter)

When an article is searchable and its publish date has passed (or on create when already public),
if `articles_mediaCharterDone = 0`:
- If it is in categories 2, 3, 6, 373 or 397: email `media-charter-notifications@nouse.co.uk`
  ("New article on Nouse.co.uk") with the headline, excerpt and link (secret `?key=md5(id)` preview
  link if future-dated), then set `mediaCharterDone = 1`.
- Otherwise set `mediaCharterDone = 2`.
Copy the exact email wording from `html/common/coreHead.php` `yorkSUNotify`.

### Cron (`html/admin/api/article/cronArticle.php`)

Periodically: post to social any searchable, past-dated article that wants posting and hasn't been
posted; send York SU notifications for searchable, past-dated articles with `mediaCharterDone = 0`.
This is what makes scheduled articles get posted/notified when their time arrives.

## Decided design

### Page layout: "writing first, settings in a sidebar" (chosen by Liam)

- Main area: large headline input, strapline, then the type-specific body editor.
- Right sidebar: Save and Preview buttons at the top, then collapsible panels:
  **Publishing** (status, date, slug), **Sections & authors**, **Thumbnail** (image + credit),
  **Edition** (edition + page), **Style & images** (drop cap, display images, portrait thumbnail),
  **Social media** (FB/Twitter toggles, social excerpt), **Saved versions**.
- Header actions (delete, view on site, stats, preview) as above.
- All existing help text and guidance from the PHP form is kept.

### Creating

- "New article" on the articles list opens a type picker (types 1, 2, 5, 6), then the same page in
  create mode at `/articles/new?type=N`. (Replaces the old `?type=` link.)
- After the first save, navigate to `/articles/{id}`.

### Pickers

Sections, categories and authors become searchable multi-select pickers (pills with ×),
replacing Select2. Categories are grouped by parent.

### Error handling (the core fix)

- Client and server share one zod schema per article type.
- Server responses use a consistent JSON shape, e.g.
  `{ error: "VALIDATION_ERROR", fieldErrors: { headline: "Headline is required" } }` with 400,
  plus distinct codes for 401/403 (no permission), 404 (article not found), 409 (slug taken),
  and 500 (genuine server error, with a message saying so).
- Each field error shows under its field; any sidebar panel containing an error opens automatically.
- A network failure (fetch throws) is the only case that says "check your connection".
- The thumbnail/credit confirmations become in-page confirm dialogs (no browser `alert/confirm`).
- Side-effect failures after a successful save (IFTTT, email, Cloudflare) do not fail the save;
  the save succeeds and the user sees a non-blocking warning naming what didn't happen.

### Data compatibility

Write the same columns and formats PHP wrote (status triplet, socialConfig 4-tuple,
comma-separated gallery ids, HTML in `articlesDrafts_text`, markdown in `articlesDrafts_markdown`,
new draft row per save, `articles_updated` = now).

**Sanitising (Claude's call):** the bar is "renders the same on the readers site", not
byte-identical output to PHP's HTMLPurifier (`cleanString`), which has no JS port. Use a JS HTML
sanitiser with an explicit allowlist covering what the readers site renders (headings, lists,
links, tables, images with size/float classes, figure/figcaption, and `data-fileid` on images).
Plain-text fields (headline, strapline, social excerpt, thumbnail credit) are stored as escaped
text the way PHP produced them. Type 5 URLs are stored as entered; the builder should check how
existing type 5 rows look in the database and match what the readers site currently renders. Type 6 HTML is generated
server-side or by the editor from the markdown; it need not match tui-editor's output byte for byte.

### Server-side jobs move to edit-backend

Social posting, York SU email, Cloudflare cache purge, audit log and the article cron all get
TypeScript implementations in edit-backend so the PHP can be retired. The cron joins the existing
`scripts/cron.ts`.

### Rollout (decided by Liam)

- PHP admin and the new editor run **in parallel for a short trial**, with PHP as the fallback if
  something in the new editor doesn't work. Nothing in this work may break the PHP admin.
- The **PHP article cron is switched off** (`cronArticle.php` removed from `docker/job-cron`) and
  the edit-backend cron takes over scheduled social posting and York SU notifications, for
  articles saved from either admin.

### Publication date timezone (decided by Liam)

Editors enter and see the publication date in **UK time (Europe/London, BST-aware)**. It is
converted to UTC for storage, which is how the column is already read (Prisma, the readers API,
the cron). This fixes the old behaviour where PHP treated typed times as UTC. Date-based URLs
(`/articles/YYYY/MM/DD/slug`) keep using the stored UTC date, as the readers site does today.
During the trial, the PHP admin will keep showing the raw UTC value; that is accepted.

**Claude's calls on cutover safety:**
- The article jobs must run about every minute (as `docker/job-cron` does for PHP today), not on
  the existing 30-minute `nextjs-cron` schedule, so scheduled articles post on time.
- Social posting and York SU notification use atomic "claim" updates (e.g. `UPDATE … WHERE
  socialConfig = <old value>` / `mediaCharterDone = 0`), so running alongside the PHP cron or two
  admins at once can never double-post or double-email.
- Old `article.php?id=N` / `article.php?type=N` links redirect to the new pages if the hosting
  setup makes that cheap; otherwise skip.
- `articlesDrafts_changelog` is never written by PHP; leave it null (still displayed if present).

## Left to the builder

- API shape (REST routes vs server actions), naming, file layout, component breakdown.
- Exact visual styling within the chosen layout (Tailwind, matching the rest of edit-backend).
- Which editor library backs types 1 and 6 (extend `DualEditor` or swap), as long as image
  insert/size/float/caption and the legacy-content substitutions work.
- Slug generation details, provided it matches PHP's rule (spaces → `-`, strip non `[a-z0-9-_.]`,
  remove dots, lowercase; on collision append `-` + 5 random `[a-z0-9]`) and the server re-checks
  uniqueness on create.
- How Cloudflare purge and Redis invalidation are wired (Redis keys used by the frontend API
  should also be invalidated so the readers site updates).
- Test strategy (Playwright e2e exists; unit tests for schemas and side-effect logic are welcome).
