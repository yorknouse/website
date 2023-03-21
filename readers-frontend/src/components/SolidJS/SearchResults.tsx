import type { SearchResponse, SearchResult } from "@components/types";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import SearchArticle from "./SearchArticle";

const SearchResults: Component = () => {
  const [articles, setArticles] = createSignal<SearchResult[]>([]);
  const [searching, setSearching] = createSignal<boolean>(true);
  const [query, setQuery] = createSignal<string>("");

  onMount(async () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    const query = params.q;

    if (query && query.length > 0) {
      const humanQuery = decodeURIComponent(query);
      setQuery(humanQuery);

      const formData = new FormData();
      formData.append("searchterm", humanQuery);

      fetch("/api/searchSuggestions.php", {
        method: "POST",
        body: formData,
      })
        .then(async (res) => {
          if (res.status !== 200) throw new Error(res.statusText);

          const response: SearchResponse = await res.json();

          if (response.result) setArticles(response.response);
          else throw new Error("Bad result from search API");
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => setSearching(false));
    } else setSearching(false);
  });

  return (
    <div class="h-full w-full">
      <Show when={searching()}>
        <div class="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2">
          <div class="h-full w-full animate-spin rounded-full border-t-2 border-l-2 border-black" />
        </div>
      </Show>
      <Show
        when={(articles() === null || articles().length === 0) && !searching()}
      >
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <p class="text-center font-arno text-lg md:text-2xl lg:text-4xl">
            We couldn't find anything for &ldquo;{query()}&rdquo;
          </p>
        </div>
      </Show>
      <Show when={articles() !== null && articles().length > 0 && !searching()}>
        <div class="flex flex-col">
          <h1 class="mx-auto mb-4 text-lg md:mx-0 md:text-2xl lg:text-4xl">
            Results for &ldquo;{query()}&rdquo;
          </h1>
          <div class="grid w-full grid-cols-2 gap-4">
            <div class="col-span-1">
              <For each={articles()}>
                {(article, i) => (
                  <>
                    {i() % 2 === 0 && (
                      <div class="w-full h-[20vh]">
                        <SearchArticle
                          headline={article.articlesDrafts_headline}
                          excerpt={article.articlesDrafts_excerpt}
                          author={`${article.users_name1} ${article.users_name2}`}
                          authorId={article.users_userid}
                          category={article.categories_name}
                          categoryColor={article.categories_backgroundColor}
                          categoryLink={article.categories_name}
                          imageUrl={article.image}
                          articleUrl={article.url}
                          isVertical={false}
                          isPortrait={article.articles_isThumbnailPortrait}
                          hideCategoryAccent={false}
                        />
                      </div>
                    )}
                  </>
                )}
              </For>
            </div>
            <div class="col-span-1">
              <For each={articles()}>
                {(article, i) => (
                  <>
                    {i() % 2 !== 0 && (
                      <div class="w-full h-[20vh]">
                        <SearchArticle
                          headline={article.articlesDrafts_headline}
                          excerpt={article.articlesDrafts_excerpt}
                          author={`${article.users_name1} ${article.users_name2}`}
                          authorId={article.users_userid}
                          category={article.categories_name}
                          categoryColor={article.categories_backgroundColor}
                          categoryLink={article.categories_name}
                          imageUrl={article.image}
                          articleUrl={article.url}
                          isVertical={false}
                          isPortrait={article.articles_isThumbnailPortrait}
                          hideCategoryAccent={false}
                        />
                      </div>
                    )}
                  </>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default SearchResults;
