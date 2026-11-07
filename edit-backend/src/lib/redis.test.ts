import { describe, expect, it, vi } from "vitest";

vi.mock("ioredis", () => ({
  default: class {
    on() {}
  },
}));

import { buildRedisOptions } from "@/lib/redis";

describe("buildRedisOptions", () => {
  it("defaults to the standalone Docker Compose service with no login", () => {
    const opts = buildRedisOptions({});

    expect(opts).toMatchObject({
      host: "valkey",
      port: 6379,
      maxRetriesPerRequest: null,
    });
    expect(opts.username).toBeUndefined();
    expect(opts.password).toBeUndefined();
    expect(opts.sentinels).toBeUndefined();
  });

  it("gives up after five retries in standalone mode", () => {
    const { retryStrategy } = buildRedisOptions({});

    expect(retryStrategy?.(5)).toBe(2000);
    expect(retryStrategy?.(6)).toBeNull();
  });

  it("passes the login in standalone mode", () => {
    const opts = buildRedisOptions({
      REDIS_HOST: "cache",
      REDIS_PORT: "6380",
      REDIS_USERNAME: "app",
      REDIS_PASSWORD: "secret",
    });

    expect(opts).toMatchObject({
      host: "cache",
      port: 6380,
      username: "app",
      password: "secret",
    });
  });

  it("treats empty login values as unset", () => {
    const opts = buildRedisOptions({ REDIS_USERNAME: "", REDIS_PASSWORD: "" });

    expect(opts.username).toBeUndefined();
    expect(opts.password).toBeUndefined();
  });

  it("stays standalone when REDIS_SENTINELS is blank", () => {
    const opts = buildRedisOptions({ REDIS_SENTINELS: " , " });

    expect(opts.sentinels).toBeUndefined();
    expect(opts.host).toBe("valkey");
  });

  it("uses Sentinel when REDIS_SENTINELS is set", () => {
    const opts = buildRedisOptions({
      REDIS_HOST: "ignored",
      REDIS_SENTINELS: "s1:26380, s2",
      REDIS_SENTINEL_MASTER: "nouse",
      REDIS_SENTINEL_USERNAME: "watcher",
      REDIS_SENTINEL_PASSWORD: "sentinel-secret",
      REDIS_USERNAME: "app",
      REDIS_PASSWORD: "secret",
    });

    expect(opts).toMatchObject({
      sentinels: [
        { host: "s1", port: 26380 },
        { host: "s2", port: 26379 },
      ],
      name: "nouse",
      sentinelUsername: "watcher",
      sentinelPassword: "sentinel-secret",
      username: "app",
      password: "secret",
    });
    expect(opts.host).toBeUndefined();
  });

  it("defaults the Sentinel master name and keeps the logins separate", () => {
    const opts = buildRedisOptions({
      REDIS_SENTINELS: "s1",
      REDIS_PASSWORD: "secret",
    });

    expect(opts.name).toBe("mymaster");
    expect(opts.sentinelPassword).toBeUndefined();
  });

  it("leaves TLS off unless REDIS_TLS is true", () => {
    for (const REDIS_TLS of [undefined, "", "false", "0"]) {
      expect(buildRedisOptions({ REDIS_TLS }).tls).toBeUndefined();

      const sentinel = buildRedisOptions({ REDIS_TLS, REDIS_SENTINELS: "s1" });
      expect(sentinel.tls).toBeUndefined();
      expect(sentinel.sentinelTLS).toBeUndefined();
      expect(sentinel.enableTLSForSentinelMode).toBeUndefined();
    }
  });

  it("uses TLS in standalone mode when REDIS_TLS is true", () => {
    expect(buildRedisOptions({ REDIS_TLS: "true" }).tls).toEqual({});
    expect(buildRedisOptions({ REDIS_TLS: "TRUE" }).tls).toEqual({});
    expect(buildRedisOptions({ REDIS_TLS: "1" }).tls).toEqual({});
  });

  it("uses TLS for the Sentinels and data nodes when REDIS_TLS is true", () => {
    const opts = buildRedisOptions({
      REDIS_TLS: "true",
      REDIS_SENTINELS: "s1",
    });

    expect(opts).toMatchObject({
      tls: {},
      sentinelTLS: {},
      enableTLSForSentinelMode: true,
    });
  });

  it("passes the database and key prefix in both modes", () => {
    const env = { REDIS_DB: "2", REDIS_KEY_PREFIX: "nouse:dev:" };

    expect(buildRedisOptions(env)).toMatchObject({
      db: 2,
      keyPrefix: "nouse:dev:",
    });
    expect(buildRedisOptions({ ...env, REDIS_SENTINELS: "s1" })).toMatchObject({
      db: 2,
      keyPrefix: "nouse:dev:",
    });
  });

  it("defaults to database 0 with no key prefix", () => {
    const opts = buildRedisOptions({});

    expect(opts.db).toBe(0);
    expect(opts.keyPrefix).toBeUndefined();
  });

  it("keeps reconnecting without queueing commands in Sentinel mode", () => {
    const opts = buildRedisOptions({ REDIS_SENTINELS: "s1" });

    expect(opts.retryStrategy?.(1000)).toBe(2000);
    expect(opts.sentinelRetryStrategy?.(1000)).toBe(2000);
    expect(opts.enableOfflineQueue).toBe(false);
    expect(opts.maxRetriesPerRequest).toBe(0);
  });
});
