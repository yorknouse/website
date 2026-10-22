import type { Metadata } from "next";
import Link from "next/link";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import ArticleEditor from "@/components/article-editor/ArticleEditor";
import { getEditorOptions } from "@/lib/article-editor/service";
import {
  createDefaults,
  isCreatableType,
  type CreatableType,
} from "@/lib/article-editor/initialValues";

export const metadata: Metadata = {
  title: "New article",
};

const TYPES: { type: CreatableType; label: string }[] = [
  { type: 1, label: "Standard article" },
  { type: 6, label: "Markdown article" },
  { type: 2, label: "Photo gallery" },
  { type: 5, label: "Print edition" },
];

export default async function NewArticle({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(31, userData.actions)) {
    return <p>Unauthorised</p>;
  }

  const { type: typeRaw } = await searchParams;
  const type = Number(typeRaw);

  if (!isCreatableType(type)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">New article</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((t) => (
            <Link
              key={t.type}
              href={`/articles/new?type=${t.type}`}
              className="rounded-lg bg-white p-6 text-lg font-semibold shadow-sm hover:bg-gray-100 transition"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const options = await getEditorOptions();

  return (
    <ArticleEditor
      // A fresh form per type when switching between ?type values.
      key={type}
      mode="create"
      type={type}
      initial={createDefaults(type)}
      options={options}
      can={{ delete: false }}
    />
  );
}
