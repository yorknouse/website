import { Accessor, Component, For, Setter } from "solid-js";

type PaginatorProps = {
  page: Accessor<number>;
  setPage: Setter<number>;
  pages: Accessor<number>;
};

const Paginator: Component<PaginatorProps> = (props) => {
  const maxDisplayPages = 5;
  return (
    <div class="flex w-full flex-row">
      <div class="mx-auto w-2/3">
        <For
          each={[...Array(props.pages())].slice(
            props.page(),
            props.page() + maxDisplayPages
          )}
        >
          {(_) => <div class="rounded-full"></div>}
        </For>
      </div>
    </div>
  );
};

export default Paginator;
