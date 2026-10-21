import { describe, expect, it } from "vitest";
import { formatUk, ukLocalToUtc, utcToUkLocal } from "./ukTime";

describe("ukLocalToUtc", () => {
  it("converts BST to UTC", () => {
    expect(ukLocalToUtc("2026-07-01T12:00")?.toISOString()).toBe(
      "2026-07-01T11:00:00.000Z",
    );
  });
  it("leaves GMT unchanged", () => {
    expect(ukLocalToUtc("2026-01-15T12:00:00")?.toISOString()).toBe(
      "2026-01-15T12:00:00.000Z",
    );
  });
  it("handles a time skipped when the clocks go forward", () => {
    const d = ukLocalToUtc("2026-03-29T01:30");
    expect(d?.toISOString()).toBe("2026-03-29T01:30:00.000Z");
    expect(utcToUkLocal(d!)).toBe("2026-03-29T02:30:00");
  });
  it("takes the first occurrence when the clocks go back", () => {
    expect(ukLocalToUtc("2026-10-25T01:30")?.toISOString()).toBe(
      "2026-10-25T00:30:00.000Z",
    );
  });
  it("returns null for malformed or impossible input", () => {
    expect(ukLocalToUtc("not a date")).toBeNull();
    expect(ukLocalToUtc("2026-02-30T12:00")).toBeNull();
    expect(ukLocalToUtc("2026-07-01T25:00")).toBeNull();
  });
});

describe("utcToUkLocal", () => {
  it("formats London time", () => {
    expect(utcToUkLocal(new Date("2026-07-01T11:00:00Z"))).toBe(
      "2026-07-01T12:00:00",
    );
  });
});

describe("formatUk", () => {
  it("formats like PHP G:i:s l j M Y", () => {
    expect(formatUk(new Date("2026-10-21T13:03:22Z"))).toBe(
      "14:03:22 Wednesday 21 Oct 2026",
    );
  });
  it("uses no leading zero on the hour", () => {
    expect(formatUk(new Date("2026-01-05T09:05:01Z"))).toBe(
      "9:05:01 Monday 5 Jan 2026",
    );
  });
});
