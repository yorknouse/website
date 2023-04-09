import { Accessor, Component, createEffect, createSignal, on } from "solid-js";

interface SearchArticleProps {
  headline: string;
  excerpt: string | null;
  author: string;
  authorId: number | undefined;
  category: string | null | undefined;
  categoryLink: string | undefined;
  categoryColor: string | undefined;
  imageUrl: string | false;
  articleUrl: string;
  isVertical?: boolean; // Defines if the image is ontop or to the left of the text
  isPortrait: boolean; // Defines if the image is portrait or landscape
  hideCategoryAccent?: boolean;
  textColour?: string;
  page: Accessor<number>;
}

const SearchArticle: Component<SearchArticleProps> = (props) => {
  const [loadingDone, setLoadingDone] = createSignal<boolean>(false);
  const imagePlaceHolder =
    "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/mWMFA4fY1ENg25x%20breakingNews_large.jpg";

  const border = () => `border-color-${props.category} border-t-2`;

  createEffect(on(props.page, () => setLoadingDone(false)));

  return (
    <div class="article h-full overflow-hidden text-ellipsis">
      <div class={`flex ${props.isVertical ? "flex-col" : "flex-row"}`}>
        {props.imageUrl ? (
          <a
            class={`image-link relative ${
              props.isVertical ? "w-full" : "h-full w-1/2"
            }`}
            href={props.articleUrl}
          >
            <div
              class={`absolute top-0 left-0 flex h-full w-full flex-col bg-whiteish-100 ${
                loadingDone() && "hidden"
              }`}
            >
              <div class="m-auto h-10 w-10 animate-spin rounded-full border-t-2 border-l-2 border-black" />
            </div>
            <img
              class={`${
                props.isPortrait
                  ? "aspect-{9/16} h-full"
                  : "aspect-video w-full"
              } rounded-xl object-cover ${props.isVertical && "mb-5"}`}
              src={props.imageUrl}
              alt="Article Thumbnail"
              onError={({ currentTarget }) => {
                if (currentTarget.src !== imagePlaceHolder)
                  currentTarget.src = imagePlaceHolder;
              }}
              onLoad={() => setLoadingDone(true)}
            />
          </a>
        ) : (
          <a
            class={`image-link relative ${
              props.isVertical ? "w-full" : "h-full w-1/2"
            }`}
            href={props.articleUrl}
          >
            <img
              class={`${
                props.isPortrait
                  ? "aspect-{9/16} h-full"
                  : "aspect-video w-full"
              } rounded-xl object-cover ${props.isVertical && "mb-5"}`}
              src={imagePlaceHolder}
              alt="Article Thumbnail"
            />
          </a>
        )}
        <div
          class={`${
            props.isVertical || props.imageUrl == undefined
              ? "w-full"
              : "ml-3 h-full w-1/2"
          } ${!props.hideCategoryAccent && border()}`}
        >
          {!props.hideCategoryAccent && (
            <a
              class={`text-l category-text category-color-${props.category} uppercase xl:text-xl 2xl:text-2xl`}
              href={`/${props.categoryLink}`}
            >
              {props.category}
            </a>
          )}
          <div class="mb-2">
            <a class="headline" href={props.articleUrl}>
              <p class="text-l text-black xl:text-xl 2xl:text-2xl">
                {props.headline}
              </p>
            </a>
            <a class="author" href={`/author/${props.authorId}`}>
              <p class="text-sm italic text-black 2xl:text-base">
                <span class={`category-color-${props.category}`}>By </span>
                {props.author}
              </p>
            </a>
          </div>
          <a class="excerpt" href={props.articleUrl}>
            <p class="text-xs text-black xl:text-sm 2xl:text-base">
              {props.excerpt}
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SearchArticle;
