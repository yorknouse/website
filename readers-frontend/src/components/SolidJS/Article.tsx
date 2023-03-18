import type { Component } from "solid-js";

type ArticleProps = {
  headline: string;
  excerpt: string | null;
  author: string;
  authorId: number | undefined;
  category: string | null | undefined;
  categoryLink: string | undefined;
  categoryColor: string | null | undefined;
  imageUrl?: string;
  articleUrl: string;
  isVertical?: boolean; // Defines if the image is ontop or to the left of the text
  isPortrait: boolean; // Defines if the image is portrait or landscape
  hideCategoryAccent?: boolean;
  textColour?: "white" | "black";
};

const Article: Component<ArticleProps> = (props) => {
  const imagePlaceHolder = "https://fakeimg.pl/640x360";
  // Default category colour to black
  const categoryColor = props.categoryColor || "000000";
  // Default text color to black
  const textColor = props.textColour || "black";

  const border = `border-color-${categoryColor.toUpperCase()} border-t-2`;

  return (
    <div class="article h-full overflow-hidden text-ellipsis">
      <div class={`flex ${props.isVertical ? "flex-col" : "flex-row"}`}>
        {props.imageUrl !== undefined && (
          <a
            class={`image-link ${props.isVertical ? "w-full" : "h-full w-1/2"}`}
            href={props.articleUrl}
          >
            <img
              class={`${
                props.isPortrait
                  ? "aspect-{9/16} h-full"
                  : "aspect-video w-full"
              } rounded-xl object-cover ${props.isVertical && "mb-5"}`}
              src={props.imageUrl}
              alt="Article Thumbnail"
              onerror={({ currentTarget }) => {
                currentTarget.onerror = null; // Prevents loop
                if (currentTarget.src !== imagePlaceHolder)
                  currentTarget.src = imagePlaceHolder;
              }}
            />
          </a>
        )}
        <div
          class={`${
            props.isVertical || props.imageUrl == undefined
              ? "w-full"
              : "ml-3 h-full w-1/2"
          } ${!props.hideCategoryAccent && border}`}
        >
          {!props.hideCategoryAccent && (
            <a
              class={`text-l category-text category-color-${categoryColor.toUpperCase()} uppercase xl:text-xl 2xl:text-2xl`}
              href={`/${props.categoryLink}`}
            >
              {props.category}
            </a>
          )}
          <div class="mb-2">
            <a class="headline" href={props.articleUrl}>
              <p class={`text-l text-${textColor} xl:text-xl 2xl:text-2xl`}>
                {props.headline}
              </p>
            </a>
            <a class="author" href={`/author/${props.authorId}`}>
              <p class={`text-${textColor} text-sm italic 2xl:text-base`}>
                <span class={`category-color-${categoryColor.toUpperCase()}`}>
                  By{" "}
                </span>
                {props.author}
              </p>
            </a>
          </div>
          <a class="excerpt" href={props.articleUrl}>
            <p class={`text-${textColor} text-xs xl:text-sm 2xl:text-base`}>
              {props.excerpt}
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Article;
