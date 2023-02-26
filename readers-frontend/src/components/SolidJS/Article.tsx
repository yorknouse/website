import type { ArticleProps } from "@components/types";
import type { Component } from "solid-js";

const Article: Component<ArticleProps> = (props) => {
  const getBorderColour = (): string => {
    switch (props.categoryColor?.toUpperCase()) {
      case "#E4362D":
        return "border-categoryRed";
      case "#EDB321":
        return "border-categoryOchre";
      case "#019940":
        return "border-categoryGreen";
      case "#3B82B8":
        return "border-categoryBlue";
      case "#2B4988":
        return "border-categoryDarkBlue";
      case "#797CAF":
        return "border-categoryLilla";
      case "#932E6C":
        return "border-categoryPurple";
      default:
        return "border-black";
    }
  };

  const getTextColour = (): string => {
    switch (props.categoryColor?.toUpperCase()) {
      case "#E4362D":
        return "text-categoryRed";
      case "#EDB321":
        return "text-categoryOchre";
      case "#019940":
        return "text-categoryGreen";
      case "#3B82B8":
        return "text-categoryBlue";
      case "#2B4988":
        return "text-categoryDarkBlue";
      case "#797CAF":
        return "text-categoryLilla";
      case "#932E6C":
        return "text-categoryPurple";
      default:
        return "text-black";
    }
  };
  return (
    <>
      {!props.isPortrait && (
        <div class="h-full overflow-hidden text-ellipsis">
          <>
            {!props.isVertical && (
              <div class="flex">
                <>
                  <a class="h-full w-1/2" href={props.articleUrl}>
                    <img
                      class="aspect-video rounded-xl object-cover "
                      src={props.imageUrl}
                      alt="Article Thumbnail"
                    />
                  </a>
                  <div
                    class={`${getBorderColour()} ml-3 h-full w-1/2 border-t-2`}
                  >
                    <a href={`/${props.category}`}>
                      <p
                        class={`text-l ${getTextColour()} font-arnoDisplay font-bold uppercase not-italic xl:text-xl 2xl:text-2xl`}
                      >
                        {props.category}
                      </p>
                    </a>
                    <div class="mb-2">
                      <a href={props.articleUrl}>
                        <p class="text-l xl:text-xl 2xl:text-2xl">
                          {props.headline}
                        </p>
                      </a>
                      <a href={`/author/${props.authorId}`}>
                        <p class="text-sm italic 2xl:text-base">
                          <span class={getTextColour()}>By </span>
                          {props.author}
                        </p>
                      </a>
                    </div>
                    <a href={props.articleUrl}>
                      <p class="text-xs xl:text-sm 2xl:text-base">
                        {props.excerpt}
                      </p>
                    </a>
                  </div>
                </>
              </div>
            )}
            {props.isVertical && (
              <div class="flex-col">
                <>
                  <a class="w-full" href={props.articleUrl}>
                    <img
                      class="mb-5 aspect-video rounded-xl object-cover"
                      src={props.imageUrl}
                      alt="Article Thumbnail"
                    />
                  </a>
                  <div class={`${getBorderColour()} border-t-2`}>
                    <a href={`/${props.category}`}>
                      <p
                        class={`text-l ${getTextColour()} font-arnoDisplay font-bold uppercase not-italic xl:text-xl 2xl:text-2xl`}
                      >
                        {props.category}
                      </p>
                    </a>
                    <div class="mb-2">
                      <a href={props.articleUrl}>
                        <p class="text-l xl:text-xl 2xl:text-2xl">
                          {props.headline}
                        </p>
                      </a>
                      <a href={`/author/${props.authorId}`}>
                        <p class="text-sm italic 2xl:text-base">
                          <span class={getTextColour()}>By </span>
                          {props.author}
                        </p>
                      </a>
                    </div>
                    <a href={props.articleUrl}>
                      <p class="text-xs xl:text-sm 2xl:text-base">
                        {props.excerpt}
                      </p>
                    </a>
                  </div>
                </>
              </div>
            )}
          </>
        </div>
      )}

      {props.isPortrait && (
        <div class="h-full overflow-hidden text-ellipsis">
          <>
            <div class="flex">
              <a class="h-full w-1/2 " href={props.articleUrl}>
                <img
                  class="aspect-{9/16} h-full rounded-xl object-cover"
                  src={props.imageUrl}
                  alt="Article Thumbnail"
                />
              </a>
              <div class={`${getBorderColour()} ml-3 h-full w-1/2 border-t-2`}>
                <a href={`/${props.category}`}>
                  <p
                    class={`text-l ${getTextColour()} font-arnoDisplay font-bold uppercase not-italic xl:text-xl 2xl:text-2xl`}
                  >
                    {props.category}
                  </p>
                </a>
                <div class="mb-2">
                  <a href={props.articleUrl}>
                    <p class="text-l xl:text-xl 2xl:text-2xl">
                      {props.headline}
                    </p>
                  </a>
                  <a href={`/author/${props.authorId}`}>
                    <p class="text-sm italic 2xl:text-base">
                      <span class={getTextColour()}>By </span>
                      {props.author}
                    </p>
                  </a>
                </div>
                <a href={props.articleUrl}>
                  <p class="text-xs xl:text-sm 2xl:text-base">
                    {props.excerpt}
                  </p>
                </a>
              </div>
            </div>
          </>
        </div>
      )}
    </>
  );
};

export default Article;
