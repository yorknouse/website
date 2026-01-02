import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

const redis =
  globalForRedis.redis ||
  new Redis({
  host: process.env.REDIS_HOST || "valkey", // Docker Compose service name
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    // Retry every 2 seconds up to 5 attempts
    if (times > 5) return null;
    return 2000;
  },
});

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
