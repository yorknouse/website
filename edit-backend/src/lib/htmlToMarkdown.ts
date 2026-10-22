import TurndownService from "turndown";

function createTurndown() {
  const t = new TurndownService({
    headingStyle: "atx", // '# Header'
    bulletListMarker: "-", // '-' instead of '*'
    emDelimiter: "*", // '*italic*' instead of '_italic_'
    strongDelimiter: "**", // '**bold**' instead of '__bold__'
    codeBlockStyle: "fenced", // triple backticks for code
  });
  t.use(require("turndown-plugin-gfm").gfm);
  // Markdown has no syntax for captions, sizes or file ids, so keep those
  // images as raw HTML (marked passes it back through unchanged).
  t.keep(["figure"]);
  t.addRule("articleImage", {
    filter: (node) =>
      node.nodeName === "IMG" &&
      (node.hasAttribute("data-fileid") || node.hasAttribute("style")),
    replacement: (_content, node) => (node as HTMLElement).outerHTML,
  });
  return t;
}

let turndown: TurndownService | null = null;

/** Article HTML -> markdown, used by the editor and when loading articles. */
export function htmlToMarkdown(html: string): string {
  turndown ??= createTurndown();
  return turndown
    .turndown(html || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
