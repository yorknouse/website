import { createMediaQuery } from "@solid-primitives/media";
import {
  Accessor,
  Component,
  createEffect,
  createSignal,
  For,
  Setter,
  Show,
} from "solid-js";

type PaginatorProps = {
  page: Accessor<number>;
  setPage: Setter<number>;
  pages: Accessor<number>;
  pagesToDisplay: number;
};

const Paginator: Component<PaginatorProps> = (props) => {
  const [firstPage, setFirstPage] = createSignal<number>(0);
  const isDesktop = createMediaQuery("(min-width: 768px)");

  const mobilePagesToDisplay = 5;
  const [allowedPagesToDisplay, setAllowedPagesToDisplay] =
    createSignal<number>(mobilePagesToDisplay);

  createEffect(() => {
    if (isDesktop()) setAllowedPagesToDisplay(props.pagesToDisplay);
    else setAllowedPagesToDisplay(mobilePagesToDisplay);
  });

  createEffect(() => {
    // This maps the first page so that they are always displayed in groups of
    // `pagesToDisplay`. Say pagesToDisplay = 5. If you are on page 2
    // firstPage is gonna be 1. Last page is 5.
    // If youy are on page 9, first page is 6 and last is 10. And so on.
    if (props.page() % allowedPagesToDisplay() !== 0)
      setFirstPage(props.page() - (props.page() % allowedPagesToDisplay()));
    else setFirstPage(props.page());
  });
  return (
    <div class="flex w-full flex-row">
      <div class="flex flex-row mx-auto w-auto">
        <Show when={firstPage() !== 0}>
          <button
            class="h-7 w-7 rounded-full border-2 border-black bg-transparent text-sm mx-2 md:h-16 md:w-16 md:text-base"
            onClick={() =>
              setFirstPage((fp) => Math.max(fp - allowedPagesToDisplay(), 0))
            }
          >
            <span
              class="iconify h-1/2 w-full text-black"
              data-icon="ic:baseline-chevron-left"
            ></span>
          </button>
        </Show>
        <For
          each={[...Array(props.pages()).keys()].slice(
            firstPage(),
            firstPage() + allowedPagesToDisplay()
          )}
        >
          {(p) => (
            <button
              class={`h-7 w-7 rounded-full border-2 border-black mx-2 md:h-16 md:w-16 ${
                p === props.page()
                  ? "bg-black text-white"
                  : "bg-transparent text-black"
              }`}
              onClick={() => props.setPage(p)}
            >
              {p + 1}
            </button>
          )}
        </For>
        <Show
          when={props.pages() - 1 - (firstPage() + allowedPagesToDisplay()) > 0}
        >
          <button
            class="h-7 w-7 rounded-full border-2 border-black bg-transparent mx-2 md:h-16 md:w-16"
            onClick={() =>
              setFirstPage((fp) => {
                if (fp + allowedPagesToDisplay() < props.pages() - 1)
                  return fp + allowedPagesToDisplay();

                return fp + (fp + allowedPagesToDisplay() - props.pages() - 1);
              })
            }
          >
            <span
              class="iconify h-1/2 w-full text-black"
              data-icon="ic:baseline-chevron-right"
            ></span>
          </button>
        </Show>
      </div>
    </div>
  );
};

export default Paginator;
