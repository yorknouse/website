import type { SearchResult } from "@components/types";
import {
  Accessor,
  Component,
  Show,
  createRenderEffect,
  createSignal,
} from "solid-js";
import SearchArticle from "./SearchArticle";

type SearchResultRowProps = {
  article1: SearchResult | undefined;
  article2: SearchResult | undefined;
  bottomBorder: boolean;
  page: Accessor<number>;
  lastArticle: SearchResult | undefined;
  baseUrl: string;
};

const SearchResultRow: Component<SearchResultRowProps> = (props) => {
  const [hasLastArticle, setHasLastArticle] = createSignal<boolean>(false);
  createRenderEffect(() => {
    // This runs prior to laying DOM down
    if (props.lastArticle) {
      if (props.article1) {
        if (props.lastArticle.articles_slug === props.article1.articles_slug)
          setHasLastArticle(true);
      }
      if (props.article2) {
        if (props.lastArticle.articles_slug === props.article2.articles_slug)
          setHasLastArticle(true);
      }
    }
  });
  return (
    <Show when={props.article1 || props.article2}>
      <div
        class={`relative flex w-full flex-row ${
          props.bottomBorder &&
          !hasLastArticle() &&
          "border-b-2 border-gray-300"
        } mt-2 pb-2`}
      >
        <div class="w-1/2">
          <Show when={props.article1} keyed>
            {(article) => (
              <div class="mr-4">
                <SearchArticle
                  headline={article.articlesDrafts_headline}
                  excerpt={article.articlesDrafts_excerpt}
                  authors={article.articles_authors}
                  category={article.categories_name}
                  categoryColor={article.categories_backgroundColor}
                  categoryLink={article.categories_name}
                  imageUrl={article.image}
                  articleUrl={`${props.baseUrl}${article.url}`}
                  isVertical={false}
                  isPortrait={article.articles_isThumbnailPortrait}
                  hideCategoryAccent={false}
                  page={props.page}
                />
              </div>
            )}
          </Show>
        </div>
        <span class="absolute left-1/2 top-2 bottom-2 -translate-x-1/2 border-[1px] border-gray-300" />
        <div class="w-1/2">
          <Show when={props.article2} keyed>
            {(article) => (
              <div class="ml-4">
                <SearchArticle
                  headline={article.articlesDrafts_headline}
                  excerpt={article.articlesDrafts_excerpt}
                  authors={article.articles_authors}
                  category={article.categories_name}
                  categoryColor={article.categories_backgroundColor}
                  categoryLink={article.categories_name}
                  imageUrl={article.image}
                  articleUrl={`${props.baseUrl}${article.url}`}
                  isVertical={false}
                  isPortrait={article.articles_isThumbnailPortrait}
                  hideCategoryAccent={false}
                  page={props.page}
                />
              </div>
            )}
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default SearchResultRow;
