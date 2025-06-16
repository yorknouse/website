import {type Accessor, type Component, Show } from "solid-js";

type SpinnerProps = {
  showAccessor: Accessor<boolean>;
};

const Spinner: Component<SpinnerProps> = (props) => {
  return (
    <Show when={props.showAccessor()}>
      <div class="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2">
        <div class="h-full w-full animate-spin rounded-full border-t-2 border-l-2 border-black" />
      </div>
    </Show>
  );
};

export default Spinner;
