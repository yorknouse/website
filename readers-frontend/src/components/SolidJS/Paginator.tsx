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
  page: Accessor<number> | number;
  setPage?: Setter<number>;
  pages: Accessor<number> | number;
  pagesToDisplay: number;
  prefix?: string;
};

const Paginator: Component<PaginatorProps> = (props) => {
  const [firstPage, setFirstPage] = createSignal<number>(0);
  const isDesktop = createMediaQuery("(min-width: 768px)");
  const getPage = () => {
    if (typeof props.page === "number") return props.page;
    else return props.page();
  };
  const getPages = () => {
    if (typeof props.pages === "number") return props.pages;
    else return props.pages();
  };
  const setPage = (page: number) => {
    if (props.setPage) return props.setPage(page);
    else if (page == 0) window.location.href = `${import.meta.env.BASE_URL}${props.prefix}`;
    else window.location.href = `${import.meta.env.BASE_URL}${props.prefix}/${page + 1}`;
  };

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
    if (getPage() % allowedPagesToDisplay() !== 0)
      setFirstPage(getPage() - (getPage() % allowedPagesToDisplay()));
    else setFirstPage(getPage());
  });
  return (
    <div class="flex w-full flex-row">
      <div class="mx-auto flex w-auto flex-row">
        <Show when={firstPage() !== 0}>
          <button
            class="mx-2 h-7 w-7 rounded-full border border-black bg-transparent text-sm md:h-16 md:w-16 md:text-base"
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
          each={[...Array(getPages()).keys()].slice(
            firstPage(),
            firstPage() + allowedPagesToDisplay()
          )}
        >
          {(p) => (
            <button
              class={`mx-2 h-7 w-7 rounded-full border border-black md:h-16 md:w-16 ${
                p === getPage()
                  ? "bg-black text-white"
                  : "bg-transparent text-black"
              }`}
              onClick={() => setPage(p)}
            >
              {p + 1}
            </button>
          )}
        </For>
        <Show
          when={getPages() - 1 - (firstPage() + allowedPagesToDisplay()) > 0}
        >
          <button
            class="mx-2 h-7 w-7 rounded-full border border-black bg-transparent md:h-16 md:w-16"
            onClick={() =>
              setFirstPage((fp) => {
                if (fp + allowedPagesToDisplay() < getPages() - 1)
                  return fp + allowedPagesToDisplay();

                return fp + (fp + allowedPagesToDisplay() - getPages() - 1);
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
