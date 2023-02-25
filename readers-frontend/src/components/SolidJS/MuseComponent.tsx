import type { categories } from "@prisma/client";
import { Component, createSignal } from "solid-js";
import type { articlesWithArticleDrafts } from "../utils/articles";
import MuseNavbar from "./MuseNavbar";

type MuseComponentProps = {
  categories: categories[];
  articles: Map<string, articlesWithArticleDrafts[]>;
};

const MuseComponent: Component<MuseComponentProps> = (props) => {
  const [active, setActive] = createSignal<string>(
    props.categories[0].categories_name!
  );

  return (
    <div class="flex w-full flex-col">
      <MuseNavbar
        active={active}
        setActive={setActive}
        categories={props.categories}
      />
    </div>
  );
};

export default MuseComponent;