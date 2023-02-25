import type { categories } from "@prisma/client";
import { Accessor, Component, For, Setter } from "solid-js";

type MuseNavbarProps = {
  active: Accessor<string>;
  setActive: Setter<string>;
  categories: categories[];
};

const MuseNavbar: Component<MuseNavbarProps> = (props) => {
  return (
    <div class="2xl:text-large hidden h-12 w-full text-base text-white sm:block 2xl:px-[13%]">
      <ul class="flex h-full w-full flex-row justify-between border-transparent border-t-[1px] border-white">
        <For each={props.categories}>
          {(category, i) => (
            <>
              {i() !== 0 && ( // No divider before Home
                <span class="h-3/5 self-center border-r-2 border-white" />
              )}
              <li
                class={`group relative flex h-full w-full border-b-4 ${
                  props.active() === category.categories_name
                    ? "border-white"
                    : "border-transparent"
                }`}
              >
                {props.active() === category.categories_name ? (
                  <a
                    class="mx-auto my-auto"
                    href={`/${category.categories_name}`}
                  >
                    {category.categories_displayName}
                  </a>
                ) : (
                  <button
                    class="mx-auto my-auto"
                    onClick={() => props.setActive(category.categories_name)}
                  >
                    {category.categories_displayName}
                  </button>
                )}
              </li>
            </>
          )}
        </For>
      </ul>
    </div>
  );
};

export default MuseNavbar;
