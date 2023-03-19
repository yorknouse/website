import { Component, For } from "solid-js";
import Article from "./Article";
import type { articlesWithArticlesDraftAndLink } from "./MuseComponent";

type MuseArticlesProps = {
  articles?: articlesWithArticlesDraftAndLink[];
  mobile?: boolean;
};

const MuseArticles: Component<MuseArticlesProps> = (props) => {
  return (
    <For each={props.articles}>
      {(article, i) => (
        <>
          {!props.mobile && (
            <div
              class={`mr-3 flex w-1/4 flex-row ${
                i() !== props.articles!.length - 1 && "border-r-2 border-white"
              }`}
            >
              <div class="pr-3">
                <Article
                  headline={article.articlesDrafts[0].articlesDrafts_headline}
                  excerpt={article.articlesDrafts[0].articlesDrafts_excerpt}
                  author={`${article.articlesDrafts[0].users?.users_name1} ${article.articlesDrafts[0].users?.users_name2}`}
                  authorId={article.articlesDrafts[0].users?.users_userid}
                  category={undefined}
                  categoryColor={"FFFFFF"}
                  categoryLink={undefined}
                  imageUrl={article.imageUrl}
                  articleUrl={`/${article.articles_published
                    ?.toISOString()
                    .substring(0, 10)
                    .replaceAll("-", "/")}/${article.articles_slug}`}
                  isVertical={true}
                  isPortrait={article.articles_isThumbnailPortrait}
                  hideCategoryAccent={true}
                  textColour={"white"}
                />
              </div>
            </div>
          )}
          {props.mobile && (
            <div class="flex w-full flex-col">
              {i() !== 0 && (
                <hr class="my-2.5 w-full self-center border-t-[1px] border-white" />
              )}
              <Article
                headline={article.articlesDrafts[0].articlesDrafts_headline}
                excerpt={article.articlesDrafts[0].articlesDrafts_excerpt}
                author={`${article.articlesDrafts[0].users?.users_name1} ${article.articlesDrafts[0].users?.users_name2}`}
                authorId={article.articlesDrafts[0].users?.users_userid}
                category={undefined}
                categoryColor={"FFFFFF"}
                categoryLink={undefined}
                imageUrl={article.imageUrl}
                articleUrl={`/${article.articles_published
                  ?.toISOString()
                  .substring(0, 10)
                  .replaceAll("-", "/")}/${article.articles_slug}`}
                isVertical={false}
                isPortrait={article.articles_isThumbnailPortrait}
                hideCategoryAccent={true}
                textColour={"white"}
              />
            </div>
          )}
        </>
      )}
    </For>
  );
};

export default MuseArticles;
