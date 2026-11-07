import { describe, expect, it } from "vitest";
import { randomSlugSuffix, slugify } from "./slug";

describe("slug", () => {
  it("slugifies a headline", () => {
    expect(slugify("University of York to open campus on the Moon!")).toBe(
      "university-of-york-to-open-campus-on-the-moon",
    );
  });

  it("removes dots", () => {
    expect(slugify("v2.0 Launch")).toBe("v20-launch");
  });

  it("generates a 5 char suffix", () => {
    expect(randomSlugSuffix()).toMatch(/^[a-z0-9]{5}$/);
  });
});
