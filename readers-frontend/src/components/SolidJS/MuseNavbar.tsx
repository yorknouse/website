import type { MuseNavbarCategory } from "@components/types";
import type { categories } from "@prisma/client";
import { Accessor, Component, For, Setter } from "solid-js";

type MuseNavbarProps = {
  active: Accessor<string>;
  setActive: Setter<string>;
  categories: MuseNavbarCategory[];
};

const MuseNavbar: Component<MuseNavbarProps> = (props) => {
  return (
    <>
      <div class="2xl:text-large hidden h-12 w-full text-base text-white sm:block 2xl:px-[13%]">
        <ul class="flex h-full w-full flex-row justify-between border-t-[1px] border-transparent border-white">
          <For each={props.categories}>
            {(category, i) => (
              <>
                {i() !== 0 && ( // No divider before Home
                  <span class="h-3/5 self-center border-r-2 border-white" />
                )}
                <li
                  class={`group relative flex h-full w-full border-b-4 ${
                    props.active() === category.name
                      ? "border-white"
                      : "border-transparent"
                  }`}
                >
                  {props.active() === category.name ? (
                    <a class="mx-auto my-auto" href={`/${category.name}`}>
                      {category.displayName}
                    </a>
                  ) : (
                    <button
                      class="mx-auto my-auto"
                      onClick={() => {
                        const previousBlock = document.getElementById(
                          `muse_${props.active()}`
                        );
                        previousBlock?.classList.remove(
                          "opacity-100",
                          "h-min",
                          "my-4"
                        );
                        previousBlock?.classList.add("opacity-0", "h-0");
                        props.setActive(category.name);

                        const newBlock = document.getElementById(
                          `muse_${category.name}`
                        );
                        newBlock?.classList.remove("opacity-0", "h-0");
                        newBlock?.classList.add("opacity-100", "h-min", "my-4");
                      }}
                    >
                      {category.displayName}
                    </button>
                  )}
                </li>
              </>
            )}
          </For>
        </ul>
      </div>
      <div class="relative flex w-full flex-col sm:hidden">
        <For each={props.categories}>
          {(category) => (
            <p
              class={`${
                category.name === props.active() ? "opacity-100" : "opacity-0"
              } absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-lg text-white transition-opacity delay-100 duration-500`}
            >
              {category.displayName}
            </p>
          )}
        </For>
        <span class="mx-4 border-b-4 border-b-white px-4 pt-8" />
      </div>
    </>
  );
};

export default MuseNavbar;
