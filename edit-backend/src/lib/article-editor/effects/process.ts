import prisma from "@/lib/prisma";
import { decodeText } from "../content";
import {
  parseSocialConfig,
  serialiseSocialConfig,
  type SocialConfig,
} from "../socialConfig";
import { purgeCaches } from "./cachePurge";
import { sendEmail } from "./email";
import { postToIfttt, type IftttEvent } from "./ifttt";
import { articlePermalink, yorkSuEmailHtml } from "./yorkSu";

const PURGE_WARNING =
  "Couldn't clear the website cache — changes may take up to 2 hours to appear";
const YORK_SU_WARNING =
  "Couldn't send the York SU notification — it will retry automatically";

// York SU only needs telling about articles in these categories.
const CHARTER_CATEGORIES = [2, 3, 6, 373, 397];
const YORK_SU = {
  email: "media-charter-notifications@nouse.co.uk",
  name: "York SU Media Charter",
};

// The configs with a platform wanted but not yet posted (cronArticle.php).
const DUE_SOCIAL_CONFIGS = [
  "1,0,1,0",
  "1,1,1,0",
  "1,0,1,1",
  "1,0,0,0",
  "1,0,0,1",
  "0,0,1,0",
  "0,1,1,0",
];

type Platform = {
  event: IftttEvent;
  wanted: keyof SocialConfig;
  posted: keyof SocialConfig;
  warning: string;
};

const PLATFORMS: Platform[] = [
  {
    event: "socialMediaAutomationFB",
    wanted: "fbWanted",
    posted: "fbPosted",
    warning: "Couldn't post to Facebook — it will retry automatically",
  },
  {
    event: "socialMediaAutomationTwitter",
    wanted: "twWanted",
    posted: "twPosted",
    warning: "Couldn't post to Twitter — it will retry automatically",
  },
];

async function readSocialConfig(articleId: number) {
  const row = await prisma.articles.findUnique({
    where: { articles_id: articleId },
    select: { articles_socialConfig: true },
  });
  return row?.articles_socialConfig ?? null;
}

/** Compare-and-swap on articles_socialConfig; true if this caller won. */
async function swapSocialConfig(articleId: number, from: string, to: string) {
  const { count } = await prisma.articles.updateMany({
    where: { articles_id: articleId, articles_socialConfig: from },
    data: { articles_socialConfig: to },
  });
  return count === 1;
}

/**
 * Clears this platform's posted flag after a failed post. The claimed value
 * is tried first; if another run has since changed a different flag, the
 * current value is re-read so only this platform's flag is released.
 */
async function releaseSocialClaim(
  articleId: number,
  p: Platform,
  claimed: string,
  original: string,
) {
  if (await swapSocialConfig(articleId, claimed, original)) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await readSocialConfig(articleId);
    const c = raw === null ? null : parseSocialConfig(raw);
    if (!raw || !c || !c[p.posted]) return;
    const released = serialiseSocialConfig({ ...c, [p.posted]: false });
    if (await swapSocialConfig(articleId, raw, released)) return;
  }
  console.error(
    `Couldn't release the ${p.event} claim on article ${articleId}`,
  );
}

async function postSocial(
  articleId: number,
  excerpt: string,
  permalink: string,
): Promise<string[]> {
  const warnings: string[] = [];
  for (const p of PLATFORMS) {
    // Re-read each time: the previous platform's claim changed the value.
    const raw = await readSocialConfig(articleId);
    const c = raw === null ? null : parseSocialConfig(raw);
    if (!raw || !c || !c[p.wanted] || c[p.posted]) continue;

    const claimed = serialiseSocialConfig({ ...c, [p.posted]: true });
    if (!(await swapSocialConfig(articleId, raw, claimed))) continue;

    if (!(await postToIfttt(p.event, excerpt, permalink))) {
      await releaseSocialClaim(articleId, p, claimed, raw);
      warnings.push(p.warning);
    }
  }
  return warnings;
}

async function notifyYorkSu(
  article: {
    articleId: number;
    headline: string;
    excerpt: string;
    publishedUtc: Date;
    slug: string;
    categoryIds: number[];
  },
  now: Date,
): Promise<string[]> {
  const inCharter = article.categoryIds.some((id) =>
    CHARTER_CATEGORIES.includes(id),
  );
  const { count } = await prisma.articles.updateMany({
    where: { articles_id: article.articleId, articles_mediaCharterDone: 0 },
    data: { articles_mediaCharterDone: inCharter ? 1 : 2 },
  });
  if (count !== 1 || !inCharter) return [];

  const sent = await sendEmail(
    YORK_SU,
    "New article on Nouse.co.uk",
    yorkSuEmailHtml(article, now),
  );
  if (sent) return [];
  await prisma.articles.updateMany({
    where: { articles_id: article.articleId, articles_mediaCharterDone: 1 },
    data: { articles_mediaCharterDone: 0 },
  });
  return [YORK_SU_WARNING];
}

/**
 * Runs the after-save side effects (cache purge, social posting, York SU
 * notification) for an article and returns warning strings for any that
 * failed. Each post and email is claimed atomically first, so concurrent
 * runs for the same article never repeat one.
 */
export async function processArticle(
  articleId: number,
  opts?: {
    purge?: { previousEditionId: number | null; previousCategoryIds: number[] };
  },
): Promise<string[]> {
  const article = await prisma.articles.findUnique({
    where: { articles_id: articleId },
    select: {
      articles_published: true,
      articles_slug: true,
      articles_showInSearch: true,
      articles_socialExcerpt: true,
      articles_mediaCharterDone: true,
      editions_id: true,
      categories: { select: { categories_id: true } },
      articlesDrafts: {
        orderBy: [
          { articlesDrafts_timestamp: "desc" },
          { articlesDrafts_id: "desc" },
        ],
        take: 1,
        select: { articlesDrafts_headline: true, articlesDrafts_excerpt: true },
      },
    },
  });
  if (!article) return [];

  const warnings: string[] = [];
  const published = article.articles_published;
  const slug = article.articles_slug;
  const categoryIds = article.categories.map((c) => c.categories_id);

  if (opts?.purge) {
    const editionIds = [
      article.editions_id,
      opts.purge.previousEditionId,
    ].filter((id): id is number => id !== null);
    const purged = await purgeCaches({
      articleId,
      articleUrl:
        published && slug ? articlePermalink(published, slug) : undefined,
      slug: slug ?? undefined,
      editionIds: [...new Set(editionIds)],
      categoryIds: [
        ...new Set([...categoryIds, ...opts.purge.previousCategoryIds]),
      ],
    });
    if (!purged) warnings.push(PURGE_WARNING);
  }

  const now = new Date();
  if (
    !article.articles_showInSearch ||
    !published ||
    !slug ||
    published > now
  ) {
    return warnings;
  }

  const draft = article.articlesDrafts[0];
  const headline = decodeText(draft?.articlesDrafts_headline ?? null);
  const excerpt = decodeText(draft?.articlesDrafts_excerpt ?? null);
  const permalink = articlePermalink(published, slug);
  const socialExcerpt =
    decodeText(article.articles_socialExcerpt) || excerpt || headline;

  warnings.push(...(await postSocial(articleId, socialExcerpt, permalink)));

  if (article.articles_mediaCharterDone === 0) {
    warnings.push(
      ...(await notifyYorkSu(
        {
          articleId,
          headline,
          excerpt,
          publishedUtc: published,
          slug,
          categoryIds,
        },
        now,
      )),
    );
  }
  return warnings;
}

/**
 * The cron job: runs processArticle for every live article with a social
 * post or York SU notification still due.
 */
export async function runDueArticleJobs(): Promise<{ processed: number }> {
  const due = await prisma.articles.findMany({
    where: {
      articles_showInSearch: true,
      articles_published: { lte: new Date() },
      OR: [
        { articles_socialConfig: { in: DUE_SOCIAL_CONFIGS } },
        { articles_mediaCharterDone: 0 },
      ],
    },
    select: { articles_id: true },
    orderBy: { articles_id: "asc" },
  });
  for (const { articles_id } of due) {
    try {
      await processArticle(articles_id);
    } catch (e) {
      console.error(`Article jobs failed for article ${articles_id}`, e);
    }
  }
  return { processed: due.length };
}
