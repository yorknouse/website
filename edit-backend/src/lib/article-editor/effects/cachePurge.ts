import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { getCategoryLink } from "@/lib/categories";

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
// Cloudflare accepts at most 30 URLs per purge request.
const PURGE_BATCH = 30;

let zoneId: string | null = null;

function cloudflareHeaders(): Record<string, string> | null {
  const email = process.env.bCMS__CLOUDFLARE_EMAIL;
  const key = process.env.bCMS__CLOUDFLARE_SECRET;
  if (!email || !key) return null;
  return {
    "X-Auth-Email": email,
    "X-Auth-Key": key,
    "Content-Type": "application/json",
  };
}

async function getZoneId(headers: Record<string, string>) {
  if (zoneId) return zoneId;
  const res = await fetch(`${CLOUDFLARE_API}/zones?name=nouse.co.uk`, {
    headers,
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { result?: { id?: string }[] };
  zoneId = body.result?.[0]?.id ?? null;
  return zoneId;
}

async function purgeCloudflare(urls: string[]): Promise<boolean> {
  if (urls.length === 0) return true;
  const headers = cloudflareHeaders();
  if (!headers) return false;
  const zone = await getZoneId(headers);
  if (!zone) return false;
  let ok = true;
  for (let i = 0; i < urls.length; i += PURGE_BATCH) {
    const res = await fetch(`${CLOUDFLARE_API}/zones/${zone}/purge_cache`, {
      method: "POST",
      headers,
      body: JSON.stringify({ files: urls.slice(i, i + PURGE_BATCH) }),
    });
    if (!res.ok) ok = false;
  }
  return ok;
}

async function purgeRedis(keys: string[]): Promise<void> {
  await redis.del(...keys);
  let cursor = "0";
  do {
    const [next, found] = await redis.scan(
      cursor,
      "MATCH",
      "similarArticles:*",
      "COUNT",
      100,
    );
    if (found.length > 0) await redis.del(...found);
    cursor = next;
  } while (cursor !== "0");
}

/**
 * Purges the readers site caches (Cloudflare and Redis) for an article, its
 * editions and categories. Returns false if any part failed; never throws.
 */
export async function purgeCaches(t: {
  articleUrl?: string;
  slug?: string;
  editionIds: number[];
  categoryIds: number[];
}): Promise<boolean> {
  try {
    const [editions, categories] = await Promise.all([
      prisma.editions.findMany({
        where: { editions_id: { in: t.editionIds } },
        select: { editions_slug: true },
      }),
      prisma.categories.findMany({
        where: { categories_id: { in: t.categoryIds } },
        select: { categories_name: true, categories_nestUnder: true },
      }),
    ]);
    const editionSlugs = editions.map((e) => e.editions_slug);

    const urls = [
      ...(t.articleUrl ? [t.articleUrl] : []),
      ...editionSlugs.map((s) => `${process.env.FRONTEND_URL}editions/${s}`),
      ...categories.map((c) =>
        getCategoryLink(c.categories_name, c.categories_nestUnder),
      ),
    ];
    const keys = [
      ...(t.slug ? [`article:slug:${t.slug}`] : []),
      ...editionSlugs.map((s) => `edition:slug:${s}`),
      "featuredHome:latest",
    ];

    const [cloudflare, cache] = await Promise.allSettled([
      purgeCloudflare(urls),
      purgeRedis(keys),
    ]);
    for (const r of [cloudflare, cache]) {
      if (r.status === "rejected")
        console.error("Cache purge failed", r.reason);
    }
    return (
      cloudflare.status === "fulfilled" &&
      cloudflare.value &&
      cache.status === "fulfilled"
    );
  } catch (e) {
    console.error("Cache purge failed", e);
    return false;
  }
}
