import { describe, expect, it } from "vitest";
import { flagsToStatus, statusToFlags } from "./status";

describe("status", () => {
  it("maps statuses to flags", () => {
    expect(statusToFlags("draft")).toEqual({
      articles_showInLists: false,
      articles_showInSearch: false,
      articles_showInAdmin: true,
    });
    expect(statusToFlags("search")).toEqual({
      articles_showInLists: false,
      articles_showInSearch: true,
      articles_showInAdmin: true,
    });
    expect(statusToFlags("published")).toEqual({
      articles_showInLists: true,
      articles_showInSearch: true,
      articles_showInAdmin: true,
    });
  });

  it("inverts flags to statuses", () => {
    for (const s of ["draft", "search", "published"] as const) {
      expect(flagsToStatus(statusToFlags(s))).toBe(s);
    }
  });

  it("treats lists without search as draft", () => {
    expect(
      flagsToStatus({
        articles_showInLists: true,
        articles_showInSearch: false,
      }),
    ).toBe("draft");
  });
});
