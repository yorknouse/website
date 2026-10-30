import { describe, expect, it } from "vitest";
import {
  decodeText,
  escapeText,
  legacyHtmlForEditor,
  renderMarkdown,
  sanitiseBodyHtml,
} from "./content";

describe("escapeText", () => {
  it("trims and encodes ampersands", () => {
    expect(escapeText("  Tom & Jerry  ")).toBe("Tom &amp; Jerry");
  });
  it("does not double escape", () => {
    expect(escapeText("Tom &amp; Jerry")).toBe("Tom &amp; Jerry");
  });
  it("keeps text around bare angle brackets and is idempotent", () => {
    const once = escapeText("a < b && c > d");
    expect(once).toBe("a &lt; b &amp;&amp; c &gt; d");
    expect(escapeText(once)).toBe(once);
    expect(escapeText("a < b > c")).toBe("a &lt; b &gt; c");
    expect(escapeText("a &lt; b &gt; c")).toBe("a &lt; b &gt; c");
  });
  it("keeps entity-encoded tags as text", () => {
    expect(escapeText("&lt;script&gt;x")).toBe("&lt;script&gt;x");
  });
  it("strips comments", () => {
    expect(escapeText("a<!-- x -->b")).toBe("ab");
  });
  it("strips tags", () => {
    expect(escapeText("<b>Hi</b>")).toBe("Hi");
  });
  it("strips tags and comments formed by removing an inner one", () => {
    expect(escapeText("<<b>i>x")).toBe("x");
    expect(escapeText("a<!<!-- x -->-- y -->b")).toBe("ab");
  });
});

describe("decodeText", () => {
  it("decodes entities and handles null", () => {
    expect(decodeText("Tom &amp; Jerry &lt;3")).toBe("Tom & Jerry <3");
    expect(decodeText(null)).toBe("");
  });
});

describe("sanitiseBodyHtml", () => {
  it("removes scripts and event handlers", () => {
    expect(
      sanitiseBodyHtml('<p onclick="x">a</p><script>alert(1)</script>'),
    ).toBe("<p>a</p>");
  });
  it("keeps data-fileid and allowed styles", () => {
    const out = sanitiseBodyHtml(
      '<img src="https://x/y.jpg" data-fileid="12" style="width: 50%; float: left;">',
    );
    expect(out).toContain('data-fileid="12"');
    expect(out).toContain("width:50%");
    expect(out).toContain("float:left");
  });
  it("drops disallowed style properties", () => {
    const out = sanitiseBodyHtml(
      '<img src="https://x/y.jpg" style="width: 50%; position: absolute;">',
    );
    expect(out).not.toContain("position");
  });
  it("keeps figure markup (img is self-closed)", () => {
    const html =
      '<figure><img src="https://x/y.jpg"><figcaption>Photo Credit: A</figcaption></figure>';
    expect(sanitiseBodyHtml(html)).toBe(html.replace('jpg">', 'jpg" />'));
  });
  it("blocks javascript: links", () => {
    expect(
      sanitiseBodyHtml('<a href="javascript:alert(1)">x</a>'),
    ).not.toContain("javascript");
  });
});

describe("renderMarkdown", () => {
  it("renders and sanitises", () => {
    expect(renderMarkdown("**bold**")).toContain("<strong>bold</strong>");
    expect(renderMarkdown("<script>x</script>hi")).not.toContain("<script");
  });
});

describe("legacyHtmlForEditor", () => {
  it("applies the twig substitutions", () => {
    expect(
      legacyHtmlForEditor("a\n[ARCHIVECDNURL]/x.jpg", "https://arch"),
    ).toBe("a<br/>https://arch/x.jpg");
    expect(legacyHtmlForEditor("Costs 5PS", "")).toBe("Costs 5&pound;");
    expect(legacyHtmlForEditor("PS and PS", "")).toBe("&pound; and &pound;");
    expect(legacyHtmlForEditor(null, "")).toBe("");
  });
});
