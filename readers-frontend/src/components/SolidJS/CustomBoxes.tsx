import { Component, For, JSXElement, createSignal } from "solid-js";

type CustomBoxesProps = {
  id: string;
  customBoxes: { type?: string; text: string; title: string }[];
  children?: JSXElement;
};

const CustomBoxes: Component<CustomBoxesProps> = (props) => {
  const [active, setActive] = createSignal<number>(0);
  const [startX, setStartX] = createSignal<number>(0);
  const displayNextBox = () => {
    props.customBoxes.every((_, index, array) => {
      if (index === active() && index + 1 < array.length) {
        const previousBlock = document.getElementById(
          `${props.id}-${active()}`
        );

        previousBlock?.classList.remove("w-full", "md:w-10/12", "opacity-100", "p-4");
        previousBlock?.classList.add("w-0", "h-0", "opacity-0", "p-0");

        setActive(index + 1);

        const newBlock = document.getElementById(
          `${props.id}-${active()}`
        );

        newBlock?.classList.remove("w-0", "h-0", "opacity-0", "p-0");
        newBlock?.classList.add("w-full", "md:w-10/12", "opacity-100", "p-4");

        return false;
      }
      return true;
    });
  };
  const displayPreviousBox = () => {
    props.customBoxes.every((_, index, array) => {
      if (index === active() && index - 1 >= 0) {
        const previousBlock = document.getElementById(
          `${props.id}-${active()}`
        );

        previousBlock?.classList.remove("w-full", "md:w-10/12", "opacity-100", "p-4");
        previousBlock?.classList.add("w-0", "h-0", "opacity-0", "p-0");

        setActive(index - 1);

        const newBlock = document.getElementById(
          `${props.id}-${active()}`
        );

        newBlock?.classList.remove("w-0", "h-0", "opacity-0", "p-0");
        newBlock?.classList.add("w-full", "md:w-10/12", "opacity-100", "p-4");

        return false;
      }
      return true;
    });
  };

  return (
    <div
      class="custom-boxes relative flex w-full flex-col"
      onTouchStart={(e) => {
        setStartX(e.changedTouches[0].screenX);
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0].screenX;

        if (startX() - endX > 100) {
          displayNextBox();
        } else if (endX - startX() > 100) {
          displayPreviousBox();
        }
      }}
    >
      <div class="py-5 flex w-full flex-row px-4 md:px-0">
        <button
          class="w-1/12 items-center justify-center hidden md:flex disabled:opacity-30"
          onClick={displayPreviousBox}
          disabled={active() === 0}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            class="w-1/4"
          >
            <path
              fill="currentColor"
              d="M162.83 205.17a4 4 0 0 1-5.66 5.66l-80-80a4 4 0 0 1 0-5.66l80-80a4 4 0 1 1 5.66 5.66L85.66 128Z"
            />
          </svg>
        </button>
        {props.children}
        <button
          class="w-1/12 items-center justify-center hidden md:flex disabled:opacity-30"
          onClick={displayNextBox}
          disabled={active() === props.customBoxes.length - 1}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            class="w-1/4"
          >
            <path
              fill="currentColor"
              d="m178.83 130.83l-80 80a4 4 0 0 1-5.66-5.66L170.34 128L93.17 50.83a4 4 0 0 1 5.66-5.66l80 80a4 4 0 0 1 0 5.66Z"
            />
          </svg>
        </button>
      </div>
      <div class="my-4 flex flex-row self-center md:hidden">
        <For each={props.customBoxes}>
          {(customBox, index) => (
            <span
              class={`mr-2 h-4 w-4 rounded-full border-[6px] transition-colors delay-100 duration-700 ${
                active() === index()
                  ? "border-white"
                  : "border-gray-500"
              }`}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default CustomBoxes;
