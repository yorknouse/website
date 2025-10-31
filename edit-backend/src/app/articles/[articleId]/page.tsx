import { z } from "zod";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { checkUserPermissions, GetUserData } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Article",
};

export default async function Article({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(32, userData.actions)) {
    return {};
  }

  const resolvedParams = await params;
  const articleIDParse = z
    .preprocess((val) => (val ? val : undefined), z.coerce.number())
    .safeParse(resolvedParams.articleId);

  if (!articleIDParse.success) {
    return <>Invalid User ID</>;
  }

  const article = await prisma.articles.findFirst({
    where: {
      articles_id: articleIDParse.data,
    },
    include: {
      articlesDrafts: {
        orderBy: { articlesDrafts_timestamp: "desc" },
        take: 1,
      },
    },
  });

  if (!article) {
    return <>Invalid Article ID</>;
  }

  return (
    <div>
      <p>{article.articles_id}</p>
      <p>{article.articlesDrafts[0].articlesDrafts_headline}</p>
    </div>
  );
}
