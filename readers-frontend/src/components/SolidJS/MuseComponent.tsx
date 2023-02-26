import type { ArticleContent, MuseNavbarCategory } from "@components/types";
import { Component, createSignal, For } from "solid-js";
import Article from "./Article";
import MuseNavbar from "./MuseNavbar";
import { createAutoAnimateDirective } from "@formkit/auto-animate/solid";

type MuseComponentProps = {
  categories: MuseNavbarCategory[];
  articles: Map<string, ArticleContent[]>;
};

const MuseComponent: Component<MuseComponentProps> = (props) => {
  const autoAnimate = createAutoAnimateDirective();
  const [active, setActive] = createSignal<string>(props.categories[0].name);

  return (
    <div class="relative flex w-full flex-col">
      <MuseNavbar
        active={active}
        setActive={setActive}
        categories={props.categories}
      />
      <div
        class="mt-4 flex w-full flex-row px-[0.5%] 2xl:px-[13%]"
        use:autoAnimate
      >
        <For each={props.articles.get(active())}>
          {(article, i) => (
            <div class="w-1/4">
              <Article
                headline={article.headline}
                excerpt={article.excerpt}
                author={article.author}
                authorId={article.authorId}
                category={active()}
                categoryColor={"#FFFFFF"}
                imageUrl={article.imageUrl}
                articleUrl={article.articleUrl}
                isVertical={true}
                isPortrait={article.isPortrait}
                isInMuseComponent={true}
              />
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default MuseComponent;
