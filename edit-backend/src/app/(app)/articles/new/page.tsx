// "use client";

import type { Metadata } from "next";
import { checkUserPermissions, GetUserData } from "@/lib/auth";
import Image from "next/image";
import DualEditor from "@/components/Editor";
import ArticlePreviewButton from "@/components/ArticlePreviewButton";

export const metadata: Metadata = {
  title: "Article",
};

export default async function NewArticle() {
  const userData = await GetUserData();
  if (!userData || !checkUserPermissions(32, userData.actions)) {
    return <p>Unauthorised</p>;
  }

  return (
    <div>
      <p>Under construction</p>
      {/*<form>*/}
      {/*<p>{article.articles_id}</p>*/}
      {/*{article.articles_type === 2 &&*/}
      {/*  galleryImages.map((image) => (*/}
      {/*    <Image*/}
      {/*      key={image}*/}
      {/*      src={image}*/}
      {/*      alt={"gallery image"}*/}
      {/*      width={64}*/}
      {/*      height={64}*/}
      {/*    />*/}
      {/*  ))}*/}
      {/*<ArticlePreviewButton props={{ articleID: article.articles_id }} />*/}
      {/*{article.articles_type !== 2 && (*/}
      {/*  <p>{article.articlesDrafts[0].articlesDrafts_headline}</p>*/}
      {/*)}*/}
      {/*<br />*/}
      {/*<h3 className={"text-xl"}>History</h3>*/}
      {/*{drafts.map((draft) => (*/}
      {/*  <div key={draft.articlesDrafts_id}>*/}
      {/*    <p>{draft.articlesDrafts_id}</p>*/}
      {/*    <p>*/}
      {/*      {new Intl.DateTimeFormat("en-GB", {*/}
      {/*        weekday: "short",*/}
      {/*        day: "2-digit",*/}
      {/*        month: "short",*/}
      {/*        year: "numeric",*/}
      {/*        hour: "2-digit",*/}
      {/*        minute: "2-digit",*/}
      {/*        second: "2-digit",*/}
      {/*      }).format(draft.articlesDrafts_timestamp)}*/}
      {/*    </p>*/}
      {/*  </div>*/}
      {/*))}*/}
      {/*<DualEditor/>*/}
      {/*</form>*/}
    </div>
  );
}
