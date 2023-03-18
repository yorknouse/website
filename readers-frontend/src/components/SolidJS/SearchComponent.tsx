import { Component, createSignal } from "solid-js";
import type { SearchResult } from "./SearchResults";
import SearchResults from "./SearchResults";

type SearchResponse = {
  response: SearchResult[];
  result: boolean;
};

const SearchComponent: Component = () => {
  const [query, setQuery] = createSignal<string>("");
  const [searchResult, setSearchResult] = createSignal<SearchResult[]>([]);
  return (
    <div class="flex h-full w-full flex-col">
      <form
        id="searchForm"
        class="mx-auto lg:mt-[20%] mt-[33%] flex flex-row items-center"
        onSubmit={(ev) => {
          ev.preventDefault();

          const formData = new FormData();
          formData.append("searchterm", query());

          fetch("/api/searchSuggestions.php", {
            method: "POST",
            body: formData,
          })
            .then(async (res) => {
              if (res.status === 200) {
                const response: SearchResponse = await res.json();

                if (response.result) setSearchResult(response.response);
                else setSearchResult([]);
              } else throw new Error(res.statusText);
            })
            .catch((e) => {
              console.error(e);

              setSearchResult([]);
            });
        }}
      >
        <input
          id="searchBox"
          type="text"
          class="w-min border-b-2 border-black bg-whiteish-100 outline-none sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl"
          placeholder="What are you looking for?"
          size="25"
          onChange={(ev) => setQuery(ev.currentTarget.value)}
        />
        <button class="w-10 md:w-14 lg:w-20">
          <span
            class="iconify h-full w-full text-black"
            data-icon="ic:sharp-search"
          ></span>
        </button>
      </form>

      <SearchResults articles={searchResult()} />
    </div>
  );
};

export default SearchComponent;
