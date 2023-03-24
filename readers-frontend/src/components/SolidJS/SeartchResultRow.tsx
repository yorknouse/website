import type { SearchResult } from "@components/types";
import { Accessor, Component, Show } from "solid-js";
import SearchArticle from "./SearchArticle";

type SearchResultRowProps = {
  article1: SearchResult;
  article2: SearchResult;
  bottomBorder: boolean;
  page: Accessor<number>;
};

const SearchResultRow: Component<SearchResultRowProps> = (props) => {
  return (
    <div
      class={`relative flex w-full flex-row ${
        props.bottomBorder && "border-b-2 border-gray-300"
      } mt-2 pb-2`}
    >
      <div class="w-1/2">
        <Show when={props.article1}>
          <div class="mr-4">
            <SearchArticle
              headline={props.article1.articlesDrafts_headline}
              excerpt={props.article1.articlesDrafts_excerpt}
              author={`${props.article1.users_name1} ${props.article1.users_name2}`}
              authorId={props.article1.users_userid}
              category={props.article1.categories_name}
              categoryColor={props.article1.categories_backgroundColor}
              categoryLink={props.article1.categories_name}
              imageUrl={props.article1.image}
              articleUrl={props.article1.url}
              isVertical={false}
              isPortrait={props.article1.articles_isThumbnailPortrait}
              hideCategoryAccent={false}
              page={props.page}
            />
          </div>
        </Show>
      </div>
      <span class="absolute left-1/2 top-2 bottom-2 -translate-x-1/2 border-[1px] border-gray-300" />
      <div class="w-1/2">
        <Show when={props.article2}>
          <div class="ml-4">
            <SearchArticle
              headline={props.article2.articlesDrafts_headline}
              excerpt={props.article2.articlesDrafts_excerpt}
              author={`${props.article2.users_name1} ${props.article2.users_name2}`}
              authorId={props.article2.users_userid}
              category={props.article2.categories_name}
              categoryColor={props.article2.categories_backgroundColor}
              categoryLink={props.article2.categories_name}
              imageUrl={props.article2.image}
              articleUrl={props.article2.url}
              isVertical={false}
              isPortrait={props.article2.articles_isThumbnailPortrait}
              hideCategoryAccent={false}
              page={props.page}
            />
          </div>
        </Show>
      </div>
    </div>
  );
};

export default SearchResultRow;
