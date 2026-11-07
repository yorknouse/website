import FieldError from "../FieldError";

interface PrintEditionBodyProps {
  embedUrl: string;
  onChange: (embedUrl: string) => void;
  error?: string;
}

// Verbatim from html/admin/article.twig:650-662 and 674-675.
const CHECKLIST = [
  "Generate a PDF with the entire edition as one file, with spreads split into two pages",
  "Generate the cover as a JPEG and set it as the thumbnail for this article",
  "Upload the pdf edition to the print edition archive directory for archival purposes",
];
const CHECKLIST_BOLD =
  "Upload the edition to the filestore enter the public shared link url below";
const NOTES = [
  'The headline is normally in the format "26 January 2011"',
  "No exceprt or author is set",
  'Category is "Print Edition Archive"',
];

export default function PrintEditionBody({
  embedUrl,
  onChange,
  error,
}: PrintEditionBodyProps) {
  return (
    <div className="space-y-4 rounded-md border border-gray-300 p-4">
      <div>
        <h3 className="font-semibold">Print Edition Checklist</h3>
        <ul className="list-disc pl-6">
          {CHECKLIST.map((t) => (
            <li key={t}>{t}</li>
          ))}
          <li>
            <b>{CHECKLIST_BOLD}</b>
          </li>
        </ul>
        <ul className="list-disc pl-6 italic">
          {NOTES.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold">Print Edition Data</h3>
        <label htmlFor="embedUrl" className="block text-sm font-medium">
          Embed URL
        </label>
        <input
          id="embedUrl"
          type="text"
          value={embedUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://e.issuu.com/anonymous-embed.html?u=yorknouse&d=idgoesherenormally"
          aria-invalid={!!error}
          aria-describedby="embedUrl-error"
          className="w-full rounded-md border border-gray-300 p-2"
        />
        <p className="text-sm italic">
          This is normally the bit after &lt;iframe src=&quot; if you&apos;re
          using issuu or the link to the filestore
        </p>
        <FieldError id="embedUrl-error" message={error} />
      </div>
    </div>
  );
}
