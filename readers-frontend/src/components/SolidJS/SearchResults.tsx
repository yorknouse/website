import { Component, For } from "solid-js";
import Article from "./Article";

type SearchResult = {
  articlesDrafts_excerpt: string;
  articlesDrafts_headline: string;
  articles_id: number;
  articles_isThumbnailPortrait: boolean;
  articles_published: string;
  articles_slug: string;
  articles_thumbnail: string;
  categories_backgroundColor: string;
  categories_displayName: string;
  categories_name: string;
  image: false | string;
  url: string;
  users_name1: string;
  users_name2: string;
  users_userid: number;
};

type SearchResulsProps = {
  articles: SearchResult[];
};

const SearchResults: Component<SearchResulsProps> = (props) => {
  return (
    <div class="flex flex-col md:flex-row w-full mb-4 mt-10 overflow-scroll">
      <For each={props.articles}>
        {(article) => (
          <div class="w-2/3 md:h-min my-4 md:my-0 md:w-1/4 mx-auto">
            <Article
              headline={article.articlesDrafts_headline}
              excerpt={article.articlesDrafts_excerpt}
              author={`${article.users_name1} ${article.users_name2}`}
              authorId={article.articles_id}
              category={article.categories_displayName}
              categoryLink={`/${article.categories_name}`}
              categoryColor={article.categories_backgroundColor}
              imageUrl={article.image ? article.image : ""}
              articleUrl={article.url}
              isVertical={true}
              isPortrait={article.articles_isThumbnailPortrait}
              hideCategoryAccent={false}
            />
          </div>
        )}
      </For>
    </div>
  );
};

export default SearchResults;

export type { SearchResult };
