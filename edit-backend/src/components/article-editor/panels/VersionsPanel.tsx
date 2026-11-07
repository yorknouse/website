import Link from "next/link";
import { formatUk } from "@/lib/article-editor/ukTime";
import type { DraftSummary } from "../ArticleEditor";

export default function VersionsPanel({ drafts }: { drafts: DraftSummary[] }) {
  if (drafts.length === 0) {
    return <p className="text-sm text-gray-500">No saved versions yet</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <tbody>
        {drafts.map((d) => (
          <tr key={d.articlesDrafts_id} className="border-b border-gray-100">
            <td className="py-1 pr-2">v{d.articlesDrafts_id}</td>
            <td className="py-1 pr-2">
              {formatUk(new Date(d.articlesDrafts_timestamp))}
            </td>
            <td className="py-1 pr-2">{d.articlesDrafts_changelog}</td>
            <td className="py-1">
              {d.articlesDrafts_userid !== null && d.userName ? (
                <Link
                  href={`/articles?user=${d.articlesDrafts_userid}`}
                  className="underline"
                >
                  {d.userName}
                </Link>
              ) : (
                d.userName
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
