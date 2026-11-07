import { describe, expect, it } from "vitest";
import { cleanText, displayText } from "./plainText";

describe("cleanText", () => {
  it("strips tags", () => {
    expect(cleanText("<b>Hi</b>")).toBe("Hi");
  });
  it("strips comments", () => {
    expect(cleanText("a<!-- x -->b")).toBe("ab");
  });
  it("drops the contents of script and style tags", () => {
    expect(cleanText("<script>x</script>y")).toBe("y");
    expect(cleanText("<style>p{}</style>z")).toBe("z");
  });
  it("trims what is left once tags are gone", () => {
    expect(cleanText("  <b> Hi </b>  ")).toBe("Hi");
  });
  it("is empty when there were only tags", () => {
    expect(cleanText("<b></b>")).toBe("");
  });
  it("stores the escaped form without double escaping", () => {
    expect(cleanText("Tom & Jerry")).toBe("Tom &amp; Jerry");
    expect(cleanText("Tom &amp; Jerry")).toBe("Tom &amp; Jerry");
  });
  it("keeps text after a bracket that never closes", () => {
    expect(cleanText("Profits<Costs say experts")).toBe(
      "Profits&lt;Costs say experts",
    );
    expect(cleanText("a<b")).toBe("a&lt;b");
    expect(cleanText("I <3 York")).toBe("I &lt;3 York");
    expect(cleanText("a < b && c > d")).toBe("a &lt; b &amp;&amp; c &gt; d");
  });
  it("keeps entity-encoded tags as escaped text", () => {
    expect(cleanText("&lt;script&gt;x")).toBe("&lt;script&gt;x");
  });
  it("never leaves live markup from tags nested to survive one pass", () => {
    for (const input of ["<<b>i>x", "a<!<!-- x -->-- y -->b"]) {
      expect(cleanText(input)).not.toMatch(/[<>]/);
    }
  });
  it("is idempotent", () => {
    for (const input of ["<b>Hi</b>", "a<b", "Tom & Jerry", "<<b>i>x"]) {
      const once = cleanText(input);
      expect(cleanText(once)).toBe(once);
    }
  });
});

describe("displayText", () => {
  it("decodes the stored form for readers", () => {
    expect(displayText("Tom &amp; Jerry")).toBe("Tom & Jerry");
    expect(displayText("Profits&lt;Costs")).toBe("Profits<Costs");
  });
  it("strips tags saved by the PHP site", () => {
    expect(displayText("<b>Hi</b> &amp; bye")).toBe("Hi & bye");
  });
  it("decodes only once", () => {
    expect(displayText("&amp;lt;b&amp;gt;")).toBe("&lt;b&gt;");
  });
  it("handles a missing value", () => {
    expect(displayText(null)).toBe("");
    expect(displayText(undefined)).toBe("");
  });
});
