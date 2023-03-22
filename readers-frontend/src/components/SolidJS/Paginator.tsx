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
};

const Paginator: Component<PaginatorProps> = (props) => {
  const maxDisplayPages = 5;

  const [firstPage, setFirstPage] = createSignal<number>(0);

  createEffect(() => {
    if (props.page() % 5 !== 0) setFirstPage(props.page() - (props.page() % 5));
    else setFirstPage(props.page());
  });
  return (
    <div class="flex w-full flex-row">
      <div class="mx-auto flex w-1/3 flex-row">
        <Show when={firstPage() !== 0}>
          <button
            class="mx-auto h-16 w-16 rounded-full border-2 border-black bg-transparent"
            onClick={() =>
              setFirstPage((fp) => Math.max(fp - maxDisplayPages, 0))
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
            firstPage() + maxDisplayPages
          )}
        >
          {(p) => (
            <button
              class={`mx-auto h-16 w-16 rounded-full border-2 border-black ${
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
        <Show when={props.pages() - 1 - (firstPage() + maxDisplayPages) > 0}>
          <button
            class="mx-auto h-16 w-16 rounded-full border-2 border-black bg-transparent"
            onClick={() =>
              setFirstPage((fp) => {
                if (fp + maxDisplayPages < props.pages() - 1)
                  return fp + maxDisplayPages;

                return fp + (fp + maxDisplayPages - props.pages() - 1);
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
