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

  createEffect(() => {
    if (props.page() % 5 !== 0) setFirstPage(props.page() - (props.page() % 5));
    else setFirstPage(props.page());
  });
  return (
    <div class="flex w-full flex-row">
      <div class="mx-auto flex flex-row">
        <Show when={firstPage() !== 0}>
          <button
            class="mx-2 h-8 w-8 rounded-full border-2 border-black bg-transparent text-sm md:h-16 md:w-16 md:text-base"
            onClick={() =>
              setFirstPage((fp) => Math.max(fp - props.pagesToDisplay, 0))
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
            firstPage() + props.pagesToDisplay
          )}
        >
          {(p) => (
            <button
              class={`mx-2 h-8 w-8 rounded-full border-2 border-black md:h-16 md:w-16 ${
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
        <Show when={props.pages() - 1 - (firstPage() + props.pagesToDisplay) > 0}>
          <button
            class="mx-2 h-8 w-8 rounded-full border-2 border-black bg-transparent md:h-16 md:w-16"
            onClick={() =>
              setFirstPage((fp) => {
                if (fp + props.pagesToDisplay < props.pages() - 1)
                  return fp + props.pagesToDisplay;

                return fp + (fp + props.pagesToDisplay - props.pages() - 1);
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
