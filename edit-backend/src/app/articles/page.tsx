import prisma from "@/lib/prisma";
import type { Metadata } from "next";

const articles = await prisma.articles.findMany({
  include: {
    articlesDrafts: true,
  },
  take: 20,
});

export const metadata: Metadata = {
  title: "Articles",
};

export default function Articles() {
  return (
    <div className="lg:flex min-h-screen bg-gray-200 text-gray-900">
      <div className={"flex flex-col"}>
        <h1 className={"text-2xl font-semibold"}>Articles</h1>
        <br />
        {articles.map((article) => (
          <div key={article.articles_id}>
            <h2 className={"text-xl font-semibold"}>
              {article.articlesDrafts[0].articlesDrafts_headline}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}
