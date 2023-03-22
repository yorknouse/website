import type { SearchResponse, SearchResult } from "@components/types";
import { Component, createSignal, For, onMount, Show } from "solid-js";
import Paginator from "./Paginator";
import SearchArticle from "./SearchArticle";
import SearchResultRow from "./SeartchResultRow";

const SearchResults: Component = () => {
  const [articles, setArticles] = createSignal<SearchResult[]>([]);
  const [searching, setSearching] = createSignal<boolean>(true);
  const [query, setQuery] = createSignal<string>("");
  const [pages, setPages] = createSignal<number>(0);
  const [page, setPage] = createSignal<number>(0);

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
            setArticles(response.response);
            setPages(Math.ceil(response.response.length / 6));
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
          <div class="flex w-full flex-col">
            <For each={[0, 2, 4]}>
              {(i) => (
                <SearchResultRow
                  article1={articles()[page() * 6 + i]}
                  article2={articles()[page() * 6 + i + 1]}
                  bottomBorder={i !== 4}
                />
              )}
            </For>
          </div>
        </div>
        <div class="my-4 w-full">
          <Paginator
            page={page}
            setPage={setPage}
            pages={pages}
            pagesPerPage={5}
          />
        </div>
      </Show>
    </div>
  );
};

export default SearchResults;
