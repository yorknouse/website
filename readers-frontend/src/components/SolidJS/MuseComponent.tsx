import type { MuseNavbarCategory } from "@components/types";
import type { articlesWithArticleDrafts } from "@components/utils/articles";
import type { categories } from "@prisma/client";
import { Component, createSignal, For, JSXElement } from "solid-js";
import MuseArticles from "./MuseArticles";
import MuseNavbar from "./MuseNavbar";

type articlesWithArticlesDraftAndLink = articlesWithArticleDrafts & {
  imageUrl: string;
};

type MuseComponentProps = {
  categories: MuseNavbarCategory[];
  articles: Map<string, articlesWithArticlesDraftAndLink[]>;
};

const MuseComponent: Component<MuseComponentProps> = (props) => {
  const [active, setActive] = createSignal<string>(props.categories[0].name);
  const [startX, setStartX] = createSignal<number>(0);

  return (
    <div
      id="muse-component"
      class="relative flex w-full flex-col"
      onTouchStart={(e) => {
        setStartX(e.changedTouches[0].screenX);
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0].screenX;

        if (startX() - endX > 100) {
          props.categories.every((category, index, array) => {
            if (category.name === active() && index + 1 < array.length) {
              const previousBlock = document.getElementById(
                `muse_mobile_${active()}`
              );

              previousBlock?.classList.remove(
                "opacity-100",
                "h-min",
                "my-4",
                "w-full"
              );
              previousBlock?.classList.add("opacity-0", "h-0", "w-0");

              setActive(array[index + 1].name);

              const newBlock = document.getElementById(
                `muse_mobile_${array[index + 1].name}`
              );

              newBlock?.classList.remove("opacity-0", "h-0", "w-0");
              newBlock?.classList.add("opacity-100", "h-min", "my-4", "w-full");

              return false;
            }
            return true;
          });
        } else if (endX - startX() > 100) {
          props.categories.every((category, index, array) => {
            if (category.name === active() && index - 1 >= 0) {
              const previousBlock = document.getElementById(
                `muse_mobile_${active()}`
              );

              previousBlock?.classList.remove(
                "opacity-100",
                "h-min",
                "my-4",
                "w-full"
              );
              previousBlock?.classList.add("opacity-0", "h-0", "w-0");

              setActive(array[index - 1].name);

              const newBlock = document.getElementById(
                `muse_mobile_${array[index - 1].name}`
              );

              newBlock?.classList.remove("opacity-0", "h-0", "w-0");
              newBlock?.classList.add("opacity-100", "h-min", "my-4", "w-full");

              return false;
            }
            return true;
          });
        }
      }}
    >
      <MuseNavbar
        active={active}
        setActive={setActive}
        categories={props.categories}
      />

      <For each={props.categories}>
        {(category, i) => (
          <>
            {/* Desktop */}
            <div
              class={`${
                i() === 0 ? "my-4 h-min opacity-100" : "h-0 opacity-0"
              } hidden w-full flex-row px-[0.5%] transition-opacity delay-100 duration-700 md:flex 2xl:px-[13%]`}
              id={`muse_${category.name}`}
            >
              <MuseArticles articles={props.articles.get(category.name)} />
            </div>

            {/* Mobile */}
            <div
              class={`${
                i() === 0
                  ? "my-4 h-min w-full opacity-100"
                  : "h-0 w-0 opacity-0"
              } flex flex-col px-4 transition-opacity delay-100 duration-500 md:hidden 2xl:px-[13%]`}
              id={`muse_mobile_${category.name}`}
            >
              <MuseArticles articles={props.articles.get(category.name)} mobile={true}/>
            </div>
          </>
        )}
      </For>
      <div class="my-4 flex flex-row self-center md:hidden">
        <For each={props.categories}>
          {(category) => (
            <span
              class={`mr-2 h-4 w-4 rounded-full border-[6px] transition-colors delay-100 duration-700 ${
                active() === category.name ? "border-white" : "border-gray-500"
              }`}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default MuseComponent;

export type { articlesWithArticlesDraftAndLink };
