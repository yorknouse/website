import redis from "./redis";
import * as util from "node:util";

export async function cache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      // Optional: log cache hit
      // console.log(`Cache hit for key: ${key}`);
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    console.warn(util.format("Cache read failed for key %s:", key), err);
    // Proceed to fetch from DB
  }

  // Fetch from DB
  const fresh = await fn();

  // Try to store in cache, but ignore errors
  try {
    await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);
  } catch (err) {
    console.warn(util.format("Cache write failed for key %s:", key), err);
  }

  return fresh;
}
