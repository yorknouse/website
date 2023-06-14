import { Component, For, Show, createSignal } from "solid-js";
import Spinner from "./Spinner";
import type { TopArticleResult, TopArticlesResponse } from "@components/types";
import SearchArticle from "./SearchArticle";

type TopArticleProps = {
  baseUrl: string;
  apiAddress: string;
};

const TopArticles: Component<TopArticleProps> = (props) => {
  const [loading, setLoading] = createSignal<boolean>(true);
  const [articles, setArticles] = createSignal<TopArticleResult[]>([]);

  fetch(props.apiAddress, { method: "POST" })
    .then(async (res) => {
      if (res.status !== 200) throw new Error(res.statusText);

      const response: TopArticlesResponse = await res.json();

      if (response.result) {
        setArticles(response.response);
      }
    })
    .catch((e) => {
      console.error(e);
    })
    .finally(() => setLoading(false));

  return (
    <Show when={loading() || articles().length > 0}>
      <div class="block min-h-[10rem] w-full">
        <h3 class="text-2xl md:text-4xl">Top Articles</h3>
        <div class="relative flex h-full flex-row md:flex-col">
          <Spinner showAccessor={loading} />
          <Show when={articles().length > 0}>
            <div class="mt-4">
              <For each={articles()}>
                {(article) => (
                  <div class="h-min">
                    <SearchArticle
                      headline={article.articlesDrafts_headline}
                      excerpt={null}
                      authors={article.articles_authors}
                      category={article.categories_name}
                      categoryColor={undefined}
                      categoryLink={undefined}
                      imageUrl={article.image}
                      articleUrl={article.url}
                      isVertical={true}
                      isPortrait={article.articles_isThumbnailPortrait}
                      hideCategoryAccent={true}
                      baseUrl={props.baseUrl}
                    />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default TopArticles;
