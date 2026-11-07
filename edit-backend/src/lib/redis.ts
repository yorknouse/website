import Redis, { RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

const RETRY_INTERVAL_MS = 2000;
const DEFAULT_SENTINEL_PORT = 26379;

function parseSentinels(value = "") {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [host, port] = entry.split(":");
      return { host, port: Number(port) || DEFAULT_SENTINEL_PORT };
    });
}

/**
 * Connects to a single server by default, or through Sentinel when
 * REDIS_SENTINELS is set. REDIS_USERNAME and REDIS_PASSWORD apply to the data
 * nodes in both modes, as do REDIS_DB and REDIS_KEY_PREFIX. REDIS_TLS=true
 * turns on TLS for every connection, including the Sentinels.
 */
export function buildRedisOptions(
  env: Record<string, string | undefined> = process.env,
): RedisOptions {
  const shared = {
    username: env.REDIS_USERNAME || undefined,
    password: env.REDIS_PASSWORD || undefined,
    db: Number(env.REDIS_DB) || 0,
    keyPrefix: env.REDIS_KEY_PREFIX || undefined,
  };

  const useTls = ["true", "1"].includes(env.REDIS_TLS?.toLowerCase() ?? "");

  const sentinels = parseSentinels(env.REDIS_SENTINELS);
  if (sentinels.length > 0) {
    return {
      ...shared,
      ...(useTls && {
        tls: {},
        sentinelTLS: {},
        enableTLSForSentinelMode: true,
      }),
      sentinels,
      name: env.REDIS_SENTINEL_MASTER || "mymaster",
      sentinelUsername: env.REDIS_SENTINEL_USERNAME || undefined,
      sentinelPassword: env.REDIS_SENTINEL_PASSWORD || undefined,
      // A failover can outlast any fixed retry budget, so keep reconnecting. If
      // sentinelRetryStrategy gives up, ioredis ends the client for good and
      // skips retryStrategy, so both must always return a delay.
      retryStrategy: () => RETRY_INTERVAL_MS,
      sentinelRetryStrategy: () => RETRY_INTERVAL_MS,
      // Reconnecting never ends, so fail commands straight away while
      // disconnected and let callers fall back to the DB.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
    };
  }

  return {
    ...shared,
    ...(useTls && { tls: {} }),
    host: env.REDIS_HOST || "valkey", // Docker Compose service name
    port: Number(env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      // Retry every 2 seconds up to 5 attempts
      if (times > 5) return null;
      return RETRY_INTERVAL_MS;
    },
  };
}

const redis = globalForRedis.redis || new Redis(buildRedisOptions());

// Handle connection errors gracefully
redis.on("error", (err) => {
  console.warn("Redis connection error (will fallback to DB):", err);
});

redis.on("close", () => {
  console.warn("Redis connection closed");
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export default redis;
