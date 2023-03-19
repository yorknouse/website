import type { SearchResponse, SearchResult } from "@components/types";
import { Component, createSignal, For } from "solid-js";
import SearchArticle from "./SearchArticle";

const SearchComponent: Component = () => {
  const [query, setQuery] = createSignal<string>("");
  const [articles, setArticles] = createSignal<SearchResult[]>([]);
  const [searching, setSearching] = createSignal<boolean>(false);
  return (
    <>
      <form
        id="searchForm"
        class="mx-auto mb-10 mt-10 flex flex-row items-center md:mt-0"
        onSubmit={(ev) => {
          ev.preventDefault();
          setSearching(true);

          const formData = new FormData();
          formData.append("searchterm", query());

          fetch("/api/searchSuggestions.php", {
            method: "POST",
            body: formData,
          })
            .then(async (res) => {
              if (res.status !== 200) throw new Error(res.statusText);

              const response: SearchResponse = await res.json();

              if (response.result) setArticles(response.response);
              else throw new Error("Bad result from search API");

              setSearching(false);
            })
            .catch((e) => {
              console.error(e);
              setArticles([]);
              setSearching(false);
            });
        }}
      >
        <input
          id="searchBox"
          type="text"
          class="w-min border-b-2 border-black bg-whiteish-100 outline-none sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl"
          placeholder="What are you looking for?"
          size="25"
          onChange={(ev) => {
            setQuery(ev.currentTarget.value);
          }}
        />
        <button class="relative h-10 w-10 md:h-14 md:w-14 lg:w-20 lg:h-20">
          {searching() ? (
            <div class="absolute h-full w-full left-2 top-0 animate-spin rounded-full border-t-2 border-l-2 border-black" />
          ) : (
            <span
              class="iconify h-full w-full text-black"
              data-icon="ic:sharp-search"
            ></span>
          )}
        </button>
      </form>
      <div class="flex w-full flex-col md:flex-row">
        <For each={articles()}>
          {(article) => (
            <div class="mx-auto mb-8 w-full md:mb-0 md:w-1/4">
              <SearchArticle
                headline={article.articlesDrafts_headline}
                excerpt={article.articlesDrafts_excerpt}
                author={`${article.users_name1} ${article.users_name2}`}
                authorId={article.users_userid}
                category={article.categories_name}
                categoryColor={article.categories_backgroundColor}
                categoryLink={`/${article.categories_name}`}
                imageUrl={article.image}
                articleUrl={article.url}
                isVertical={true}
                isPortrait={article.articles_isThumbnailPortrait}
                hideCategoryAccent={false}
              />
            </div>
          )}
        </For>
      </div>
    </>
  );
};

export default SearchComponent;
