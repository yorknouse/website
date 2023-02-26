import type { MuseNavbarCategory } from "@components/types";
import type { categories } from "@prisma/client";
import { Component, createSignal, JSXElement } from "solid-js";
import MuseNavbar from "./MuseNavbar";

type MuseComponentProps = {
  categories: MuseNavbarCategory[];
  children?: JSXElement;
};

const MuseComponent: Component<MuseComponentProps> = (props) => {
  const [active, setActive] = createSignal<string>(props.categories[0].name);

  return (
    <div class="flex w-full flex-col">
      <MuseNavbar
        active={active}
        setActive={setActive}
        categories={props.categories}
      />
      {props.children}
    </div>
  );
};

export default MuseComponent;
