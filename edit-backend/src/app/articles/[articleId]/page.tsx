import { z } from "zod";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import { s3URL } from "@/lib/s3URL";
import Image from "next/image";
import DualEditor from "@/components/Editor";
import ArticlePreviewButton from "@/components/ArticlePreviewButton";

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
      edition: true,
      users: {
        include: {
          users: {
            select: {
              users_userid: true,
              users_name1: true,
              users_name2: true,
            },
          },
        },
      },
      categories: { select: { categories_id: true } },
      articlesDrafts: {
        orderBy: { articlesDrafts_timestamp: "desc" },
        take: 1,
      },
    },
  });

  if (!article) {
    return <>Invalid Article ID</>;
  }

  let galleryImages: string[] = [];
  // 2️⃣ If it's a gallery-type article, process image list
  if (article.articles_type === 2) {
    const text = article.articlesDrafts?.[0]?.articlesDrafts_text ?? "";
    galleryImages = await Promise.all(
      text
        ? text
            .split(",")
            .map(async (image) => await s3URL(Number(image), "small"))
        : [],
    );
  }

  // 3️⃣ Include full draft history (with users)
  const drafts = await prisma.articlesDrafts.findMany({
    where: { articles_id: article.articles_id },
    include: {
      users: {
        select: { users_userid: true, users_name1: true, users_name2: true },
      },
    },
    orderBy: { articlesDrafts_timestamp: "desc" },
  });

  return (
    <div>
      <p>{article.articles_id}</p>
      {article.articles_type === 2 &&
        galleryImages.map((image) => (
          <Image
            key={image}
            src={image}
            alt={"gallery image"}
            width={64}
            height={64}
          />
        ))}
        <ArticlePreviewButton props={{ articleID: article.articles_id }} />
      {article.articles_type !== 2 && (
        <p>{article.articlesDrafts[0].articlesDrafts_headline}</p>
      )}
        <br />
        <h3 className={"text-xl"}>History</h3>
      {drafts.map((draft) => (
        <div key={draft.articlesDrafts_id}>
          <p>{draft.articlesDrafts_id}</p>
          <p>
            {new Intl.DateTimeFormat("en-GB", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }).format(draft.articlesDrafts_timestamp)}
          </p>
        </div>
      ))}
        <DualEditor initialMarkdown={article.articlesDrafts[0].articlesDrafts_markdown !== null ? article.articlesDrafts[0].articlesDrafts_markdown : undefined} />
    </div>
  );
}
