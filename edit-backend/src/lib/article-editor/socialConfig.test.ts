import { describe, expect, it } from "vitest";
import {
  parseSocialConfig,
  serialiseSocialConfig,
  socialConfigForCreate,
  socialConfigForEdit,
} from "./socialConfig";

describe("socialConfig", () => {
  it("parses four parts", () => {
    expect(parseSocialConfig("1,0,1,0")).toEqual({
      fbWanted: true,
      fbPosted: false,
      twWanted: true,
      twPosted: false,
    });
  });

  it("returns null unless exactly four parts", () => {
    expect(parseSocialConfig("1,0")).toBeNull();
  });

  it("serialises", () => {
    expect(
      serialiseSocialConfig({
        fbWanted: true,
        fbPosted: false,
        twWanted: true,
        twPosted: false,
      }),
    ).toBe("1,0,1,0");
  });

  it("builds config for create", () => {
    expect(
      socialConfigForCreate({ postToFacebook: true, postToTwitter: false }),
    ).toBe("1,0,0,0");
  });

  it("does not change wanted for an already posted platform", () => {
    expect(
      socialConfigForEdit("1,1,1,0", {
        postToFacebook: false,
        postToTwitter: false,
      }),
    ).toBe("1,1,0,0");
  });

  it("updates wanted for an unposted platform", () => {
    expect(
      socialConfigForEdit("0,0,0,1", {
        postToFacebook: true,
        postToTwitter: false,
      }),
    ).toBe("1,0,0,1");
  });

  it("returns unparseable raw unchanged", () => {
    expect(
      socialConfigForEdit("1,0", { postToFacebook: true, postToTwitter: true }),
    ).toBe("1,0");
  });
});
