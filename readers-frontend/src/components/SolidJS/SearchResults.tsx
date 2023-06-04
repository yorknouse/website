import type { SearchResponse, SearchResult } from "@components/types";
import { createMediaQuery } from "@solid-primitives/media";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import Paginator from "./Paginator";
import SearchArticle from "./SearchArticle";
import SearchResultRow from "./SearchResultRow";
import Spinner from "./Spinner";

type SearchResultsProps = {
  baseUrl: string;
}

const SearchResults: Component<SearchResultsProps> = (props) => {
  const [articles, setArticles] = createSignal<SearchResult[]>([]);
  const [lastArticle, setLastArticle] = createSignal<SearchResult>();
  const [searching, setSearching] = createSignal<boolean>(true);
  const [query, setQuery] = createSignal<string>("");
  const [pages, setPages] = createSignal<number>(0);
  const [page, setPage] = createSignal<number>(0);
  const isDesktop = createMediaQuery("(min-width: 768px)");

  const articlesPerPage = 6;
  const pagesToDisplay = 5;

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

          if (response.result) {
            setLastArticle(response.response[response.response.length - 1]);
            setArticles(response.response);
            setPages(Math.ceil(response.response.length / articlesPerPage));
            setPage(0);
          } else throw new Error("Bad result from search API");
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => setSearching(false));
    } else setSearching(false);
  });

  return (
    <div class="h-full w-full">
      <Spinner showAccessor={searching} />
      <Show
        when={(articles() === null || articles().length === 0) && !searching()}
      >
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <p
            class="text-center font-arno text-lg md:text-2xl lg:text-4xl"
            id="searchFallback"
          >
            We couldn't find anything for &ldquo;{query()}&rdquo;
          </p>
        </div>
      </Show>
      <Show when={articles() !== null && articles().length > 0 && !searching()}>
        <div class="flex  w-full flex-col" id="searchResults_container">
          <h1 class="mx-auto mb-4 text-lg md:mx-0 md:text-2xl lg:text-4xl">
            Results for &ldquo;{query()}&rdquo;
          </h1>
          <Show
            when={isDesktop()}
            fallback={
              <For
                each={[
                  ...articles().slice(
                    page() * articlesPerPage,
                    page() * articlesPerPage + articlesPerPage
                  ),
                ]}
              >
                {(article, i) => (
                  <div
                    class={`mt-4 ${
                      i() !== articlesPerPage - 1 &&
                      article.articles_slug !== lastArticle()?.articles_slug &&
                      "border-b-2 border-gray-300"
                    } pb-4`}
                  >
                    <SearchArticle
                      headline={article.articlesDrafts_headline}
                      excerpt={article.articlesDrafts_excerpt}
                      authors={article.articles_authors}
                      category={article.categories_name}
                      categoryColor={article.categories_backgroundColor}
                      categoryLink={article.categories_name}
                      imageUrl={article.image}
                      articleUrl={article.url}
                      isVertical={false}
                      isPortrait={article.articles_isThumbnailPortrait}
                      hideCategoryAccent={false}
                      page={page}
                      baseUrl={props.baseUrl}
                    />
                  </div>
                )}
              </For>
            }
          >
            <For each={[0, 2, 4]}>
              {(i) => (
                <Show when={articles().length >= page() * articlesPerPage + i}>
                  <SearchResultRow
                    article1={articles()[page() * articlesPerPage + i]}
                    article2={articles()[page() * articlesPerPage + i + 1]}
                    bottomBorder={i !== 4}
                    page={page}
                    baseUrl={props.baseUrl}
                    lastArticle={lastArticle()}
                  />
                </Show>
              )}
            </For>
          </Show>
        </div>
        <div class="my-4 w-full" id="paginator-container">
          <Paginator
            page={page}
            setPage={setPage}
            pages={pages}
            pagesToDisplay={pagesToDisplay}
          />
        </div>
      </Show>
    </div>
  );
};

export default SearchResults;
