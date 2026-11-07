# Article Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the PHP admin's article create/edit page (types 1, 2, 5, 6), its save API and its background jobs in edit-backend, with field-level errors.

**Architecture:** Pure helpers (status, social config, slug, UK time, sanitising, zod schema) in `src/lib/article-editor/`, used by both the browser and the server. A server-only service writes to the DB in a transaction exactly as PHP did, then runs `processArticle()`, which handles social posting, the York SU email and cache purge with atomic claims. The cron calls the same `processArticle()` through an internal endpoint every minute. The UI is one `ArticleEditor` client component (main writing area plus collapsible sidebar panels), used by `/articles/new?type=N` and `/articles/[id]`.

**Tech Stack:** Next.js 16 app router, React 19, Prisma (MySQL), zod 4, Tailwind, react-quill-new + @uiw/react-md-editor (existing `DualEditor`), `marked`, `sanitize-html` (new), nodemailer, vitest + @testing-library/react + jsdom (new).

**Spec:** `docs/superpowers/specs/2026-10-21-article-editor-design.md`. Read it first; its "feature inventory" section is the source of truth for fields, help text and behaviour.

## Global Constraints

- All paths below are relative to `edit-backend/` unless they start with `docker/` or `html/`.
- Permissions (action numbers via `checkUserPermissions(n, user.actions)` from `src/lib/auth.ts`): **31 = create, 32 = edit/view, 33 = delete**. Always read the user server-side with `GetUserData()`; never trust user ids or permissions sent from the browser.
- DB formats must match PHP: status triplet (Draft 0/0/1, Search only 0/1/1, Published 1/1/1 for showInLists/showInSearch/showInAdmin); `articles_socialConfig` = `"fb_wanted,fb_posted,tw_wanted,tw_posted"`; gallery body = comma-separated s3files ids; a new `articlesDrafts` row per save; `articles_updated` = now; slug and type never change after create.
- Publication date is entered and shown in **Europe/London** time and stored as UTC.
- Reuse the env var names PHP already uses (same `nouseprod-local.env`): `bCMS__IFTTT`, `bCMS__CLOUDFLARE_EMAIL`, `bCMS__CLOUDFLARE_SECRET`, `EMAIL_HOST`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM`, plus the existing `FRONTEND_URL` (has a trailing slash) and `ARCHIVEFILESTOREURL`. New: `CRON_SECRET`, `INTERNAL_APP_URL` (default `http://localhost:3000`). Add every new one to `example.env` with a comment.
- The PHP admin must keep working during the trial. Do not change PHP files except `docker/cron-minute.sh` and `docker/job-cron` (Task 8).
- Liveblogpro (type 4) is not creatable. An existing type 4 article opens with its metadata editable and the body left untouched.
- A side-effect failure (Cloudflare, IFTTT, email) never fails a save. It is returned as a warning string.
- Copy every PHP help text verbatim (the `article.twig` lines are cited in the tasks).

## Review Focus

1. **Re-saving a PHP-saved article unchanged** (headline containing `&amp;`, a type 1 body with `[ARCHIVECDNURL]`) must not double-escape or lose content. Covered in Task 3 (`escapeText` idempotence) and Task 5 (round-trip test).
2. **A malformed legacy `socialConfig`** (not 4 parts, e.g. `"1,0"`) must be left as it is, never crash, and never post. Covered in Task 1 and Task 6.
3. **The session expiring mid-edit** must show "log in again" and keep everything typed. Covered in Task 10.
4. **The cron and a save processing the same article at once** must post to each platform once and email York SU once. Covered in Task 6 (concurrent `processArticle` test).
5. **Gallery captions containing commas** (PHP split captions on commas and corrupted them) must survive. Covered in Task 5.

---

### Task 1: Test tooling + status, social config and slug helpers

**Files:**
- Modify: `package.json` (devDeps `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `vite-tsconfig-paths`; scripts `"test:unit": "vitest run --project unit"`, `"test:db": "vitest run --project db"`)
- Create: `vitest.config.ts` (two projects. `unit`: `src/**/*.test.ts(x)` excluding `*.db.test.ts`, environment `node`, with `// @vitest-environment jsdom` per component test. `db`: `src/**/*.db.test.ts`, `fileParallelism: false`, `setupFiles: ["src/test/dbSetup.ts"]`)
- Create: `src/lib/article-editor/status.ts`, `socialConfig.ts`, `slug.ts`
- Test: `src/lib/article-editor/status.test.ts`, `socialConfig.test.ts`, `slug.test.ts`

**Interfaces (produces):**
- `type ArticleStatus = "draft" | "search" | "published"`
- `statusToFlags(s: ArticleStatus): { articles_showInLists: boolean; articles_showInSearch: boolean; articles_showInAdmin: true }`
- `flagsToStatus(a: { articles_showInLists: boolean; articles_showInSearch: boolean }): ArticleStatus`. Lists+search = published, search only = search, else draft (this matches the twig `selected` logic).
- `type SocialConfig = { fbWanted: boolean; fbPosted: boolean; twWanted: boolean; twPosted: boolean }`
- `parseSocialConfig(raw: string): SocialConfig | null` (null unless exactly 4 comma parts). `serialiseSocialConfig(c: SocialConfig): string` (`"1,0,1,0"` style).
- `socialConfigForCreate(t: { postToFacebook: boolean; postToTwitter: boolean }): string`
- `socialConfigForEdit(raw: string, t: { postToFacebook: boolean; postToTwitter: boolean }): string`. Returns `raw` unchanged if unparseable. Otherwise each platform's `wanted` becomes the toggle only if that platform is not yet posted.
- `slugify(headline: string): string`. Copy of `article.twig:195`: split on spaces and join with `-`, strip `[^a-zA-Z0-9-_.]`, lowercase, remove `.`. Do **not** URI-encode (nothing is left to encode).
- `randomSlugSuffix(): string`: 5 chars from `[a-z0-9]`.

- [ ] **Step 1: Install devDeps, add `vitest.config.ts` and scripts.** Run `npx vitest --version`. Expected: prints a version.
- [ ] **Step 2: Write failing tests**
  - `statusToFlags("draft")` → `{false,false,true}`; `"search"` → `{false,true,true}`; `"published"` → `{true,true,true}`; `flagsToStatus` inverts all three, and `{lists:true,search:false}` → `"draft"`.
  - `parseSocialConfig("1,0,1,0")` → all four fields; `parseSocialConfig("1,0")` → `null`.
  - `socialConfigForCreate({postToFacebook:true, postToTwitter:false})` → `"1,0,0,0"`.
  - `socialConfigForEdit("1,1,1,0", {postToFacebook:false, postToTwitter:false})` → `"1,1,0,0"` (FB already posted, so unchanged).
  - `socialConfigForEdit("1,0", {...})` → `"1,0"`.
  - `slugify("University of York to open campus on the Moon!")` → `"university-of-york-to-open-campus-on-the-moon"`; `slugify("v2.0 Launch")` → `"v20-launch"`; `randomSlugSuffix()` matches `/^[a-z0-9]{5}$/`.
- [ ] **Step 3: Run `npm run test:unit`.** Expected: FAIL (modules missing).
- [ ] **Step 4: Implement the three modules.**
- [ ] **Step 5: Run `npm run test:unit`.** Expected: PASS.
- [ ] **Step 6: Commit** `Adding vitest and article status/social/slug helpers`.

### Task 2: UK time conversion

**Files:**
- Create: `src/lib/article-editor/ukTime.ts`
- Test: `src/lib/article-editor/ukTime.test.ts`

**Interfaces (produces):**
- `ukLocalToUtc(local: string): Date | null`. Input is an `<input type="datetime-local" step="1">` value, `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`. Returns null when the input is malformed. Use `Intl.DateTimeFormat` with `timeZone: "Europe/London"` (no new dependency).
- `utcToUkLocal(d: Date): string`: `YYYY-MM-DDTHH:mm:ss` in London time.
- `formatUk(d: Date): string`: for display, e.g. `"14:03:22 Tuesday 21 Oct 2026"` (the PHP `G:i:s l j M Y` format, in London time).

- [ ] **Step 1: Write failing tests**
  - `ukLocalToUtc("2026-07-01T12:00")` → `2026-07-01T11:00:00.000Z` (BST).
  - `ukLocalToUtc("2026-01-15T12:00:00")` → `2026-01-15T12:00:00.000Z` (GMT).
  - Clocks go forward, time that doesn't exist: `ukLocalToUtc("2026-03-29T01:30")` → `2026-03-29T01:30:00.000Z`, which shows as 02:30 BST.
  - Clocks go back, time that happens twice: `ukLocalToUtc("2026-10-25T01:30")` → `2026-10-25T00:30:00.000Z` (take the first, BST, occurrence).
  - `ukLocalToUtc("not a date")` → `null`.
  - `utcToUkLocal(new Date("2026-07-01T11:00:00Z"))` → `"2026-07-01T12:00:00"`.
  - `formatUk(new Date("2026-10-21T13:03:22Z"))` → `"14:03:22 Wednesday 21 Oct 2026"`.
- [ ] **Step 2: Run `npm run test:unit -- ukTime`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run it again.** Expected: PASS.
- [ ] **Step 5: Commit** `Adding UK time conversion for publish dates`.

### Task 3: Sanitising, text escaping and legacy body loading

**Files:**
- Modify: `package.json` (dep `sanitize-html`, devDep `@types/sanitize-html`)
- Create: `src/lib/article-editor/content.ts` (server-safe; no DOM)
- Test: `src/lib/article-editor/content.test.ts`

**Interfaces (produces):**
- `escapeText(s: string): string`: trim, decode HTML entities, strip tags, then encode only `&`, `<` and `>`. This is idempotent, so `escapeText(escapeText(x)) === escapeText(x)`. It matches the HTMLPurifier output PHP stored for plain fields.
- `decodeText(s: string | null): string`: decodes entities, for showing stored plain fields in inputs.
- `sanitiseBodyHtml(html: string): string`: `sanitize-html` allowlist: `p br h1-h6 strong b em i u s strike sub sup blockquote ul ol li a hr table thead tbody tr th td figure figcaption img span div`. Attributes: `a[href,target,rel]`, `img[src,alt,data-fileid,style]`, `figure[style,class]`, `td/th[colspan,rowspan]`, `*[class]`. Allowed styles: `width`, `float`, `text-align`, `color`, `background-color`. Schemes `http`, `https`, `mailto`.
- `renderMarkdown(md: string): string`: `marked.parse(md)` then `sanitiseBodyHtml`.
- `legacyHtmlForEditor(html: string | null, archiveUrl: string): string`: the `article.twig:343` substitutions in order: `"PS"`→`"&pound;"`, `"\n"`→`"<br/>"`, `"[ARCHIVECDNURL]"`→`archiveUrl`.

- [ ] **Step 1: Write failing tests**
  - `escapeText("  Tom & Jerry  ")` → `"Tom &amp; Jerry"`; `escapeText("Tom &amp; Jerry")` → `"Tom &amp; Jerry"` (no double escape); `escapeText("<b>Hi</b>")` → `"Hi"`.
  - `sanitiseBodyHtml('<p onclick="x">a</p><script>alert(1)</script>')` → `"<p>a</p>"`.
  - `sanitiseBodyHtml('<img src="https://x/y.jpg" data-fileid="12" style="width: 50%; float: left;">')` keeps `data-fileid="12"`, `width:50%` and `float:left`.
  - `sanitiseBodyHtml('<figure><img src="https://x/y.jpg"><figcaption>Photo Credit: A</figcaption></figure>')` is unchanged.
  - `renderMarkdown("**bold**")` contains `<strong>bold</strong>`.
  - `legacyHtmlForEditor("a\n[ARCHIVECDNURL]/x.jpg", "https://arch")` → `"a<br/>https://arch/x.jpg"`.
- [ ] **Step 2: Run `npm run test:unit -- content`.** Expected: FAIL.
- [ ] **Step 3: Install deps and implement.**
- [ ] **Step 4: Run it again.** Expected: PASS.
- [ ] **Step 5: Commit** `Adding article content sanitising and legacy loading`.

### Task 4: Save schema, field errors and API error contract

**Files:**
- Create: `src/lib/article-editor/schema.ts`, `src/lib/apiErrors.ts`
- Test: `src/lib/article-editor/schema.test.ts`

**Interfaces (produces):**
- `articleSaveSchema`: a zod discriminated union on `type` (`1 | 2 | 4 | 5 | 6`) with these shared fields:
  - `headline`: string, trimmed, min 1 `"Headline is required"`, max 500 `"Headline must be 500 characters or fewer"`
  - `excerpt`: string, max 2000, default `""`
  - `published`: string, must pass `ukLocalToUtc`, error `"Enter a valid publication date and time"`
  - `status`: `ArticleStatus`
  - `editionId`: int or null
  - `editionPage`: string, max 100, default `""`
  - `categoryIds`, `authorIds`: arrays of positive ints, default `[]`
  - `dropCap`, `displayImages`, `thumbnailPortrait`, `postToFacebook`, `postToTwitter`: boolean
  - `socialExcerpt`: max 280 `"Social excerpt must be 280 characters or fewer"`
  - `thumbnailId`: positive int or null (null means unchanged on edit; on create the default is 1)
  - `thumbnailCredit`: max 500
  - `slug`: string or undefined. Create only; the service enforces that it's present on create: `"Slug is required — it is generated from the headline"`; regex `/^[a-z0-9_-]+$/` `"Slug can only contain lowercase letters, numbers, - and _"`; max 255
  - Per type, the body:
    - type 1: `{ html: string }`
    - type 6: `{ markdown: string }` (the server renders the HTML)
    - type 2: `{ images: { id: number; caption: string /*max 500*/ }[] }`
    - type 5: `{ embedUrl: string }`, which must be a valid URL: `"Enter a valid embed URL"`
    - type 4: no body
- `type ArticleSaveInput = z.infer<typeof articleSaveSchema>`
- `type FieldErrors = Partial<Record<string, string>>`. Keys are top-level field names, or `body.images.N.caption`, `body.embedUrl`, `body.html`, `body.markdown`.
- `zodToFieldErrors(err: z.ZodError): FieldErrors`: first message per joined path.
- `src/lib/apiErrors.ts`:
  - `type ApiErrorCode = "VALIDATION_ERROR" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "SLUG_TAKEN" | "SERVER_ERROR"`
  - `type ApiErrorBody = { error: ApiErrorCode; message: string; fieldErrors?: FieldErrors; suggestedSlug?: string }`
  - `apiError(code, message, status, extra?): NextResponse<ApiErrorBody>`
  - Status by code: VALIDATION_ERROR 400, UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404, SLUG_TAKEN 409, SERVER_ERROR 500.

- [ ] **Step 1: Write failing tests**
  - A type 1 payload with `headline: "  "` → `zodToFieldErrors` gives `{ headline: "Headline is required" }`.
  - `socialExcerpt` of 281 chars → the 280 message.
  - `published: "2026-13-45T99:99"` → the date message.
  - A type 5 payload with `embedUrl: "nope"` → `{ "body.embedUrl": "Enter a valid embed URL" }`.
  - A valid type 2 payload with caption `"Left, right, centre"` parses with the caption unchanged.
- [ ] **Step 2: Run `npm run test:unit -- schema`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run it again.** Expected: PASS.
- [ ] **Step 5: Commit** `Adding article save schema and API error contract`.

### Task 5: Article save service (DB)

**Files:**
- Create: `src/lib/article-editor/service.ts` (server only; `import "server-only"` is fine)
- Create: `src/test/dbSetup.ts` (refuses to run unless `DATABASE_URL` contains `test`; truncates `articlesAuthors`, `articlesCategories`, `articlesDrafts`, `articles`, `auditLog`, `emailSent` before each test), `src/test/fixtures.ts` (`makeUser()`, `makeCategory()`, `makeEdition()`, `makeS3File()`)
- Test: `src/lib/article-editor/service.db.test.ts`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
  - `type SaveResult = { ok: true; articleId: number; draftId: number; warnings: string[] } | { ok: false; code: "VALIDATION_ERROR" | "NOT_FOUND" | "SLUG_TAKEN"; message: string; fieldErrors?: FieldErrors; suggestedSlug?: string }`
  - `createArticle(input: ArticleSaveInput, userId: number): Promise<SaveResult>`
  - `updateArticle(articleId: number, input: ArticleSaveInput, userId: number): Promise<SaveResult>`. The input `type` must equal the stored type, else VALIDATION_ERROR `{ type: "Article type cannot be changed" }`. For stored type 4, ignore any body and copy the previous draft's `articlesDrafts_text`.
  - `softDeleteArticle(articleId: number, userId: number): Promise<{ ok: boolean }>`: the status flags all go to 0, audit `DELETE`, then purge (Task 6).
  - `isSlugTaken(slug: string): Promise<boolean>`
  - `getArticleForEditor(articleId: number)`: the article, its latest draft, categoryIds, authors (`{id,name}`), and all drafts with user names, newest first. Only `showInAdmin = true`.
  - `type EditorOptions = Awaited<ReturnType<typeof getEditorOptions>>`
  - `getEditorOptions()`: `{ sections: {id,name}[]; categories: {groupName, items:{id,name}[]}[]; editions: {id,label}[] }`. Copy the PHP queries in `article.php:43-78`: public categories ordered by `categories_order, categories_displayName`, 2 nesting levels flattened under the top level; editions not deleted, newest first, label `name (Number N)`.

Behaviour (spec "What saving does on the server"). Put all DB writes in one `prisma.$transaction`:
- Check references first and collect field errors: unknown/deleted category → `categoryIds: "One of the chosen sections or categories no longer exists"`; unknown/deleted user → `authorIds: "One of the chosen authors no longer exists"`; edition missing/deleted → `editionId: "That edition no longer exists"`; s3file missing → `thumbnailId` / `body.images.N.caption`: `"Image not found — try uploading it again"`.
- Create: if the slug is taken, return SLUG_TAKEN with `fieldErrors.slug = "That slug is already taken"` and `suggestedSlug = slug + "-" + randomSlugSuffix()`.
- Plain fields go through `escapeText`. Type 1 `html` and type 6 rendered markdown go through `sanitiseBodyHtml`. Type 6 also stores the raw `articlesDrafts_markdown`. Type 2 stores the ids joined with `,` and updates each `s3files_meta_caption` (escaped). Type 5 stores the URL as entered.
- Categories and authors are replaced to match the input (delete the ones no longer listed, insert the new ones).
- Audit log `CREATE` / `EDIT`: `auditLog_actionTable "articles"`, `auditLog_actionData String(articleId)`, `users_userid userId`.
- After the transaction commits, call `processArticle(articleId, { purge: { previousEditionId, previousCategoryIds } })` from Task 6 and pass its warnings through. Until Task 6 lands, stub it as an import that returns `[]`.

- [ ] **Step 1: Write failing DB tests**
  - Create type 1 → `articles` row with status flags, `socialConfig "1,0,1,0"` when both toggles are on, published equal to the UTC instant, thumbnail `"1"` when `thumbnailId` is null; one draft; category and author rows; audit `CREATE`.
  - Update with a changed headline → a second draft row, the first is untouched; slug unchanged even if the input `slug` differs; audit `EDIT`.
  - Update removing one author and adding another → exactly the new set.
  - Round trip (Review Focus 1): store a draft headline `"Tom &amp; Jerry"`, load it via `getArticleForEditor`, save `decodeText` of it, and the new draft headline is `"Tom &amp; Jerry"`.
  - Gallery captions with commas (Review Focus 5): images `[{id:a, caption:"Left, right"}]` → `s3files_meta_caption` = `"Left, right"`, draft text = `"a"`.
  - Unknown author id → `ok:false`, VALIDATION_ERROR, `fieldErrors.authorIds` set, and no rows written.
  - Create with a taken slug → SLUG_TAKEN with a `suggestedSlug` matching `/^taken-[a-z0-9]{5}$/`.
  - Type 4 update with a body → the previous body is kept.
- [ ] **Step 2: Run `npm run test:db -- service`** against a test DB (`DATABASE_URL=...nouse_test npx prisma migrate deploy` first). Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run it again.** Expected: PASS.
- [ ] **Step 5: Commit** `Adding article save service`.

### Task 6: Side effects (social, York SU, cache purge) with atomic claims

**Files:**
- Create: `src/lib/article-editor/effects/ifttt.ts`, `email.ts`, `cachePurge.ts`, `yorkSu.ts`, `process.ts`
- Test: `src/lib/article-editor/effects/process.db.test.ts`, `src/lib/article-editor/effects/yorkSu.test.ts`

**Interfaces (produces):**
- `postToIfttt(event: "socialMediaAutomationFB" | "socialMediaAutomationTwitter", excerpt: string, permalink: string): Promise<boolean>`: POST to `https://maker.ifttt.com/trigger/{event}/with/key/{bCMS__IFTTT}`, form body `value1, value2, value3=null`. Returns false if the key is unset or the response isn't ok.
- `sendEmail(to: { email: string; name: string }, subject: string, html: string): Promise<boolean>`: nodemailer SMTP, `EMAIL_HOST`, port 587, STARTTLS, auth `EMAIL_USERNAME`/`EMAIL_PASSWORD`, from `EMAIL_FROM` "Nouse No-Reply". On success, insert an `emailSent` row (`users_userid` null).
- `articlePermalink(publishedUtc: Date, slug: string): string` → `${FRONTEND_URL}articles/YYYY/MM/DD/${slug}` (UTC date parts).
- `purgeCaches(t: { articleUrl?: string; slug?: string; editionIds: number[]; categoryIds: number[] }): Promise<boolean>`. Cloudflare: zone id from `GET /client/v4/zones?name=nouse.co.uk` (memoised), then `POST /client/v4/zones/{id}/purge_cache` with `{ files: [...] }`, headers `X-Auth-Email`/`X-Auth-Key`. URLs: the article, `${FRONTEND_URL}editions/{editions_slug}`, and `getCategoryLink(name, nestUnder)` for each category. Redis: delete `article:slug:{slug}`, `edition:slug:{editionSlug}`, `featuredHome:latest`, and any `similarArticles:*` (SCAN). Returns false on any failure; never throws.
- `yorkSuEmailHtml(a: { headline: string; excerpt: string; publishedUtc: Date; slug: string; articleId: number }, now: Date): string`: the exact wording from `html/common/coreHead.php:410-416`, including the future-dated secret link `?key=md5(articleId)`. Show the date in UK time.
- `processArticle(articleId: number, opts?: { purge?: { previousEditionId: number | null; previousCategoryIds: number[] } }): Promise<string[]>`: returns warnings. Steps:
  1. If `opts.purge` is set, purge (the current plus previous edition and categories). On failure, warn `"Couldn't clear the website cache — changes may take up to 2 hours to appear"`.
  2. If the article is searchable and published ≤ now: for each platform that is wanted and not posted, claim it with `updateMany({ where: { articles_id, articles_socialConfig: old }, data: { articles_socialConfig: withPostedFlag } })`. If `count === 1`, call IFTTT; on failure, revert with `updateMany` where config = new → old and warn `"Couldn't post to Facebook — it will retry automatically"` (or Twitter). The excerpt is socialExcerpt, else strapline, else headline (decoded).
  3. Same condition, and `mediaCharterDone = 0`: claim with `updateMany(where mediaCharterDone 0 → 1 if in categories [2,3,6,373,397] else 2)`. If claimed to 1, send to `media-charter-notifications@nouse.co.uk` ("York SU Media Charter"), subject `"New article on Nouse.co.uk"`. On failure, revert to 0 and warn `"Couldn't send the York SU notification — it will retry automatically"`.
- `runDueArticleJobs(): Promise<{ processed: number }>`: finds every article that is searchable, published ≤ now and (socialConfig in the wanted-not-posted set from `cronArticle.php:12-14`, or `mediaCharterDone = 0`), and runs `processArticle` on each without purge.

- [ ] **Step 1: Write failing tests** (mock `ifttt.ts` and `email.ts` with `vi.mock`; mock `fetch` for Cloudflare; mock redis)
  - A due article with `"1,0,1,0"` → IFTTT called once per platform, stored config `"1,1,1,1"`.
  - Review Focus 4: `await Promise.all([processArticle(id), processArticle(id)])` → IFTTT FB called exactly once, Twitter exactly once, email exactly once.
  - IFTTT FB returns false → config `"1,0,1,1"` and a Facebook warning is returned.
  - Review Focus 2: config `"1,0"` → IFTTT never called, no throw, config unchanged.
  - Future-dated article → nothing posted or emailed.
  - Category 6 article → email sent and `mediaCharterDone = 1`; a category 99 article → no email, `mediaCharterDone = 2`.
  - `yorkSuEmailHtml` for a future article contains `"This article will be published at"` and `?key=` + md5 of the id; for a past article it contains `"<b>Link to article: </b>"`.
- [ ] **Step 2: Run `npm run test:db -- process` and `npm run test:unit -- yorkSu`.** Expected: FAIL.
- [ ] **Step 3: Implement, and replace the Task 5 stub import with the real `processArticle`.**
- [ ] **Step 4: Run `npm run test:unit && npm run test:db`.** Expected: PASS.
- [ ] **Step 5: Commit** `Adding article social, York SU and cache side effects`.

### Task 7: API routes

**Files:**
- Create: `src/app/api/backend/articles/route.ts` (POST create)
- Create: `src/app/api/backend/articles/[articleId]/route.ts` (PUT update, DELETE soft delete)
- Create: `src/app/api/backend/articles/slug/route.ts` (GET `?headline=` → `{ slug }`; uses `slugify`, then appends `randomSlugSuffix()` if `isSlugTaken`. Permission 31.)
- Create: `src/app/api/backend/users/search/route.ts` (GET `?q=` → `{ id, name }[]`, max 20, non-deleted, matched on `users_name1`/`users_name2`, names decoded. Permission 32.)
- Delete: `src/app/api/backend/article/route.ts` (the WIP route)
- Modify: `src/lib/articles.ts`: remove `deleteArticle`. It is a server action that trusts a browser-supplied `userID` and `userActions`, so anyone can call it with forged permissions.
- Modify: `src/components/ArticleDeleteButton.tsx`: call `DELETE /api/backend/articles/{id}`, drop the `userID`/`userActions` props, and update its callers.
- Modify: `src/components/AuthorMultiSelect.tsx`: delete it (Task 11 replaces it).
- Test: `src/app/api/backend/articles/route.test.ts`, `[articleId]/route.test.ts` (mock `GetUserData` and the service)

**Interfaces:**
- Consumes: Task 4 `apiError`/`zodToFieldErrors`, Task 5 service.
- Produces (the browser relies on these):
  - `POST /api/backend/articles`, body `ArticleSaveInput` → 201 `{ articleId, draftId, warnings }`
  - `PUT /api/backend/articles/{id}` → 200 `{ articleId, draftId, warnings }`
  - `DELETE /api/backend/articles/{id}` → 200 `{ ok: true }`
  - Errors use `ApiErrorBody`. Messages: 401 `"You're not logged in"`, 403 `"You don't have permission to create articles"` / `"…edit articles"` / `"…delete articles"`, 404 `"Article not found"`, 400 `"Some fields need fixing"`, and an unexpected throw → 500 `"Something went wrong on the server while saving"` (log the error with `console.error`).
  - Body that isn't JSON → 400 VALIDATION_ERROR `"Invalid request"`.

- [ ] **Step 1: Write failing tests**
  - No session → 401 UNAUTHENTICATED.
  - A user without 31 → 403 on POST; without 33 → 403 on DELETE.
  - An invalid body → 400 with `fieldErrors.headline`.
  - Service returns SLUG_TAKEN → 409 with `suggestedSlug`.
  - Service throws → 500 SERVER_ERROR.
  - Success → 201 with an `articleId`.
- [ ] **Step 2: Run `npm run test:unit -- api/backend/articles`.** Expected: FAIL.
- [ ] **Step 3: Implement the routes, the delete fix and the removals.** Run `npx tsc --noEmit` to catch broken callers.
- [ ] **Step 4: Run `npm run test:unit` and `npx tsc --noEmit`.** Expected: PASS with no type errors.
- [ ] **Step 5: Commit** `Adding article save/delete API with structured errors`.

### Task 8: Cron takeover

**Files:**
- Create: `src/app/api/internal/cron/articles/route.ts` (POST. Requires the header `x-cron-secret` to equal `CRON_SECRET`, otherwise 401. Calls `runDueArticleJobs()` and returns `{ processed }`.)
- Modify: `src/proxy.ts`: make sure `/api/internal/` is not behind the next-auth redirect (it has its own secret check).
- Modify: `scripts/cron.ts`: dispatch on `process.argv[2]`. `"articles"` → `fetch(${INTERNAL_APP_URL}/api/internal/cron/articles, POST, header)` and log the result with `logToFile`. `"reads"` or no argument → the existing `updateArticlesReadsSummary()`.
- Modify: `docker/nextjs-cron`: add `* * * * * /usr/local/bin/node /app/dist/cron.js articles >> /var/log/cron.log 2>&1` and keep the 30-minute line (it calls `reads` implicitly).
- Modify: `docker/cron-minute.sh`: remove the `cronArticle.php` line. Leave a comment that article jobs now run in edit-backend.
- Modify: `example.env`: `CRON_SECRET`, `INTERNAL_APP_URL`.
- Test: `src/app/api/internal/cron/articles/route.test.ts`

- [ ] **Step 1: Write failing tests:** no or wrong header → 401 and `runDueArticleJobs` not called; correct header → 200 `{ processed: n }`.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement.** Run `npx tsc -p tsconfig.cron.json`. Expected: compiles.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `Moving article cron jobs from PHP to edit-backend`.

### Task 9: Upload helper and editor upgrades

**Files:**
- Create: `src/lib/uploadClient.ts`. Extract the sign → PUT → complete flow from `src/components/AvatarUploader.tsx:60-115` into `uploadFile(file: File, typeid: number, subtype?: number): Promise<{ id: number; url: string }>`. It throws an `UploadError` whose `message` is user-readable: `"That file type isn't allowed"`, `"File is too large"` (from the 400 issues), or `"Upload failed — check your connection and try again"`. Make `AvatarUploader` use it.
- Modify: `src/components/Editor.tsx` (`DualEditor`):
  - Props become `{ initialHtml?: string; initialMarkdown?: string; storeAs: "html" | "markdown"; onChange: (v: { html: string; markdown: string }) => void; onImageUpload?: (file: File) => Promise<{ id: number; url: string }> }`. Remove `onSubmit`/`confirmData`.
  - The mode toggles become `<button type="button">` (replacing the `<a>` workaround).
  - An "Insert picture" toolbar button uploads via `onImageUpload` and inserts `<img src data-fileid>` (WYSIWYG) or `![id](url)` (markdown; spaces in the URL as `%20`).
  - Image tools for the selected image in WYSIWYG: size 100/50/25% (`style="width: N%"`), float left/right/none (`float: left|right`), and "Add caption", which wraps it in `<figure>` + `<figcaption>Photo Credit: </figcaption>`. Use a Quill custom blot so `data-fileid`, `style` and figure survive the round trip.
  - Pasting into WYSIWYG strips `<span>` wrappers, keeping their text (PHP `pasteBefore` behaviour).
- Test: `src/lib/uploadClient.test.ts` (mock fetch: a 400 with an extension issue → `"That file type isn't allowed"`; success returns `{id,url}`), `src/components/Editor.test.tsx` (jsdom: `initialHtml` with `<img data-fileid="5" style="width: 50%; float: left;">` → the `onChange` html still contains `data-fileid="5"` and `width: 50%`).

- [ ] **Step 1: Write the failing tests.** Run them. Expected: FAIL.
- [ ] **Step 2: Implement.** Run `npm run test:unit`. Expected: PASS.
- [ ] **Step 3: Manual check in `npm run dev`:** upload and insert an image, set it to 50% and float left, add a caption, switch to markdown and back. Expected: the image keeps its size, float and caption.
- [ ] **Step 4: Commit** `Adding image uploads and tools to the article editor`.

### Task 10: ArticleEditor shell, save flow and error display

**Files:**
- Create: `src/components/article-editor/ArticleEditor.tsx` (client), `SidebarPanel.tsx`, `FieldError.tsx`, `SaveStatus.tsx`, `useArticleForm.ts`
- Delete: `src/components/ArticleForm.tsx` (the WIP)
- Test: `src/components/article-editor/ArticleEditor.test.tsx` (jsdom, mock `fetch`)

**Interfaces:**
- Consumes: Task 4 schema/types, the Task 7 endpoints, Task 2 `utcToUkLocal`.
- Produces:
  - `ArticleEditor` props: `{ mode: "create" | "edit"; type: 1 | 2 | 4 | 5 | 6; initial: ArticleFormValues; options: EditorOptions /*Task 5 getEditorOptions*/; article?: { id: number; slug: string; publishedUtc: string; showInSearch: boolean; showInAdmin: boolean; socialConfig: string; drafts: DraftSummary[] }; can: { delete: boolean } }`
  - `type ArticleFormValues = Omit<ArticleSaveInput, "type">`, with `published` as a UK datetime-local string.
  - `SidebarPanel` props: `{ id: PanelId; title: string; defaultOpen?: boolean; forceOpen?: boolean; children }`
  - `type PanelId = "publishing" | "taxonomy" | "thumbnail" | "edition" | "style" | "social" | "versions"`
  - `FIELD_TO_PANEL: Record<string, PanelId>`: `status, published, slug` → publishing; `categoryIds, authorIds` → taxonomy; `thumbnailId, thumbnailCredit` → thumbnail; `editionId, editionPage` → edition; `dropCap, displayImages, thumbnailPortrait` → style; `postToFacebook, postToTwitter, socialExcerpt` → social.
  - Body slot: `ArticleEditor` renders `children`-free; it picks the body component by `type` (Task 12 components; until then, placeholders).

Layout (spec "Decided design"): the main column is a large headline input (placeholder `"University of York to open campus on the Moon"`), the strapline (placeholder `"Use of straplines is advisable for display purposes"`), then the body. Sidebar: Save and Preview buttons, then the panels in the `PanelId` order above. Publishing, taxonomy and thumbnail are open by default.

Save flow (`useArticleForm.save()`):
1. Validate client-side with `articleSaveSchema`. Show field errors and open their panels; stop.
2. Confirmations, using the existing `ConfirmAction` style of in-page dialog. Never `window.confirm`. The texts are verbatim from `article.twig:697`, `717-718` and `741`:
   - The thumbnail is the default (1).
   - A non-default thumbnail with an empty credit.
   - Type ≠ 6 with a non-default thumbnail.
3. Send the request. The button shows `"Saving…"`.
4. Results:
   - 201 → `router.push("/articles/{id}")`.
   - 200 → `"Saved"` with the time, and the versions list refreshes (`router.refresh()`).
   - Warnings → an amber non-blocking banner listing them.
   - 400/409 → field errors under their fields, panels forced open, and a red summary at the top: `"Some fields need fixing"` plus the count. For 409, offer a "Use {suggestedSlug}" button next to the slug.
   - 401 → `"You've been logged out. Log in again in a new tab, then press Save — your changes are still here."`
   - 403/404 → the server message.
   - 500 → `"The server hit an error saving this article. Your changes are still on this page — try again, and if it keeps happening contact support@nouse.co.uk."`
   - `fetch` throws → `"Couldn't reach the server. Check your connection and try again."`
5. Dirty tracking: `beforeunload` while unsaved changes exist, cleared after a successful save or delete.

- [ ] **Step 1: Write failing tests**
  - Submit with an empty headline → `"Headline is required"` shown and `fetch` not called.
  - Server 400 `{fieldErrors:{authorIds:"One of the chosen authors no longer exists"}}` → the message is shown, and the "Sections & authors" panel is open even if it was collapsed.
  - Review Focus 3: server 401 → the logged-out message, and the headline input still holds the typed value.
  - `fetch` rejects → the connection message; a server 500 does **not** show the connection message.
  - Warnings `["Couldn't post to Facebook — it will retry automatically"]` → the amber banner text, and the save is shown as successful.
  - Default thumbnail → the confirm dialog appears; cancel → no `fetch`.
- [ ] **Step 2: Run `npm run test:unit -- ArticleEditor`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run it again.** Expected: PASS.
- [ ] **Step 5: Commit** `Adding article editor shell with field-level errors`.

### Task 11: Sidebar panels and pickers

**Files:**
- Create: `src/components/article-editor/MultiSelect.tsx`: a searchable multi-select with pills and ×. Props `{ label; selected: {id,name}[]; onChange(ids, items); options?: {groupName?: string; items:{id,name}[]}[]; search?: (q: string) => Promise<{id,name}[]>; placeholder }`. It filters `options` locally, or calls `search` debounced by 300 ms. Keyboard: arrows, Enter adds, Backspace on an empty input removes the last pill.
- Create: `src/components/article-editor/panels/PublishingPanel.tsx`, `TaxonomyPanel.tsx`, `ThumbnailPanel.tsx`, `EditionPanel.tsx`, `StylePanel.tsx`, `SocialPanel.tsx`, `VersionsPanel.tsx`
- Test: `src/components/article-editor/MultiSelect.test.tsx`, `panels/SocialPanel.test.tsx`, `panels/PublishingPanel.test.tsx`

Panel contents (help text verbatim from `article.twig` line numbers):
- **Publishing:** a status select (Draft / Display in search only / Published); `<input type="datetime-local" step="1">` labelled "Publication date (UK time)" with the help text from :61; the slug, read-only. On create, it's generated by calling `/api/backend/articles/slug?headline=` when the headline input blurs, only while no slug has been generated yet. The help text from :155.
- **Taxonomy:** Sections (`MultiSelect` over `options.sections`); Categories (`MultiSelect` over `options.categories`, grouped); Authors (`MultiSelect` with `search` → `/api/backend/users/search`), with the help text from :115. Sections and categories both write into `categoryIds`.
- **Thumbnail:** a preview (`s3URL`-resolved URL passed in `initial`, or the upload result); an upload button via `uploadFile(file, 3, articleId ?? 0)`; the guidance text from :305; a credit input (placeholder `"Image credit for caption"`) shown only when the thumbnail isn't the default.
- **Edition:** a select with an empty option and `options.editions`; "Print Edition Page Number" as a text input.
- **Style & images:** "Drop Capital"; "Display Images in the Article" with the :143 text and link; "Is the thumbnail image in portrait orientation?" with the :148 text. On create, display images defaults to on.
- **Social:** "Post to Facebook" / "Post to Twitter" checkboxes. Once `parseSocialConfig(article.socialConfig)` says a platform is posted, its box is disabled and labelled "Posted to …". A social excerpt textarea (maxLength 280, placeholder `"Custom excerpt for social media display"`), disabled when both are posted. Both default to on for create.
- **Versions:** a table of `v{id}`, `formatUk(timestamp)`, changelog, and the author linked to `/articles?user={id}`.

- [ ] **Step 1: Write failing tests**
  - MultiSelect: typing "ne" with option "News" → choosing it adds a pill and calls `onChange([id])`; × removes it.
  - MultiSelect with `search` → it's called once 300 ms after typing stops.
  - SocialPanel with socialConfig `"1,1,1,0"` → the Facebook box is disabled with text "Posted to Facebook", and Twitter is enabled.
  - PublishingPanel (create): headline blur → fetch to `/api/backend/articles/slug?headline=…` and the slug field shows the response; no second fetch once a slug exists.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement and wire the panels into `ArticleEditor`.**
- [ ] **Step 4: Run `npm run test:unit`.** Expected: PASS.
- [ ] **Step 5: Commit** `Adding article editor sidebar panels and pickers`.

### Task 12: Body editors per type

**Files:**
- Create: `src/components/article-editor/bodies/RichTextBody.tsx` (types 1 and 6: `DualEditor` with `storeAs` = html for 1 and markdown for 6, and `onImageUpload` = `uploadFile(f, 2, articleId ?? 0)`), `GalleryBody.tsx`, `PrintEditionBody.tsx`, `LegacyLiveblogNotice.tsx`
- Test: `src/components/article-editor/bodies/GalleryBody.test.tsx`

- **Gallery (2):** a grid of images (thumbnails come from `initial`, plus new uploads via `uploadFile(f, 2, 2)` as PHP did), each with a remove (×) button and an inline caption textarea (instead of PHP's prompt dialog). The value is `images: {id, caption}[]` in display order.
- **Print edition (5):** the checklist and the italic notes verbatim from `article.twig:650-662`; an "Embed URL" input with the placeholder and help text from :674-675.
- **Liveblog (4):** a notice: `"Liveblogpro articles can't be edited here any more. You can still change this article's details in the sidebar; the liveblog embed is kept as it is."`
- Type 1 initial HTML is `legacyHtmlForEditor(draft.text, ARCHIVEFILESTOREURL)`, computed on the server page (Task 13). Type 6 initial markdown is `articlesDrafts_markdown`.

- [ ] **Step 1: Write the failing test:** Gallery with two images; remove the first and type the caption `"A, B"` on the second → `onChange` is called with `[{ id: second, caption: "A, B" }]`.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement and wire into `ArticleEditor` by type.**
- [ ] **Step 4: Run `npm run test:unit`.** Expected: PASS.
- [ ] **Step 5: Commit** `Adding gallery, print edition and rich text article bodies`.

### Task 13: Pages, header actions and the list entry point

**Files:**
- Modify: `src/app/(app)/articles/[articleId]/page.tsx`. Replace the body: check permission 32, then `getArticleForEditor` (show "Article not found" when it's null), `getEditorOptions()`, resolve the thumbnail and gallery URLs with `s3URL`, build `initial` (decoded plain fields, `utcToUkLocal(published)`, status from `flagsToStatus`, toggles from `parseSocialConfig`), and render `<ArticleEditor mode="edit">`.
- Modify: `src/app/(app)/articles/new/page.tsx`. Check permission 31. With no valid `?type` (1, 2, 5, 6), show the type picker: four cards labelled "Standard article", "Markdown article", "Photo gallery", "Print edition", each linking to `?type=N`. Otherwise render `<ArticleEditor mode="create">` with defaults: published = now in UK time, status draft, display images on, both social toggles on, thumbnail 1.
- Create: `src/components/article-editor/HeaderActions.tsx`. Delete (permission 33 and `showInAdmin`; `ArticleDeleteButton`; then go to `/articles`). "View on site" and "Stats" when searchable and the published time is past (the same URLs as the list page, `src/app/(app)/articles/page.tsx:179-205`). Otherwise `ArticlePreviewButton` for saved articles.
- Modify: `src/app/(app)/articles/page.tsx`: a "New article" button linking to `/articles/new`, shown only with permission 31.

- [ ] **Step 1: Run `npx tsc --noEmit && npm run lint && npm run build`.** Expected: all pass.
- [ ] **Step 2: Manual check against the dev DB, one article per type.**
  - Create type 1 with no headline: the field error appears and the Publishing panel stays usable.
  - Create with headline "Test & check" and save: you land on `/articles/{id}`, the slug is `test--check`, and the DB headline is `Test &amp; check`.
  - Edit: change an author and save. Saved versions shows 2 rows.
  - Open a PHP-created type 1 article: the content and images look as they did in PHP.
  - Gallery: upload two images, caption one `"A, B"`, save, reload: the caption is intact.
  - Set the date to a BST time, save, then check the DB value is one hour earlier in UTC.
  - Delete: the article disappears from the list.
  - Open the same article in the PHP admin: it still loads and saves.
- [ ] **Step 3: Commit** `Wiring article create/edit pages to the new editor`.

---

## Notes for the executor

- Old `article.php` links are **not** redirected. The PHP admin is the fallback during the trial, so its URLs must keep working (this overrides the spec's optional redirect).
- The existing code uses permission 30 for delete in `src/lib/articles.ts`. The spec and PHP use 33; follow the spec.
