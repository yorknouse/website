"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";

/**
 * Plain-English help on typing < and > in headline-style fields, which are
 * stripped of anything that looks like HTML when saved (see plainText.ts).
 * Opens on hover, keyboard focus or a tap, since phones have no hover.
 */
export default function SymbolsHelp({
  id,
  field,
}: {
  id: string;
  field: string;
}) {
  const [open, setOpen] = useState(false);
  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <span className="relative inline-flex" onMouseLeave={hide}>
      <button
        type="button"
        aria-label={`Help with < and > in the ${field}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onFocus={show}
        onBlur={hide}
        onClick={show}
        onKeyDown={(e) => {
          if (e.key === "Escape") hide();
        }}
        className="inline-flex cursor-help items-center gap-1 rounded text-sm text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <CircleHelp aria-hidden="true" className="h-4 w-4" />
        Using &lt; and &gt;
      </button>
      {open && (
        <div
          id={id}
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] space-y-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-lg"
        >
          <p className="font-semibold text-gray-900">
            Typing &lt; and &gt; in the {field}
          </p>
          <p>
            You can use them as normal, but{" "}
            <strong>put a space after &lt;</strong>. Write &ldquo;Profits &lt;
            costs&rdquo;, not &ldquo;Profits&lt;costs&rdquo;.
          </p>
          <p>
            Without the space, the website can mistake the words up to the next
            &gt; for hidden formatting and delete them when you save.
            &ldquo;Profits&lt;costs and sales&gt;targets&rdquo; would be saved
            as &ldquo;Profitstargets&rdquo;.
          </p>
          <p>
            Bold, italics and links aren&rsquo;t possible here. If you paste
            text with formatting from elsewhere, it is removed and only the
            words are kept.
          </p>
          <p className="text-gray-500">
            &amp;, quotes and £ are all fine. Not sure? Preview the article
            after saving.
          </p>
        </div>
      )}
    </span>
  );
}
