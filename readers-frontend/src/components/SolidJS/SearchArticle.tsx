import {
  type Accessor,
  type Component,
  createEffect,
  createSignal,
  on,
} from "solid-js";

interface SearchArticleProps {
  headline: string;
  excerpt: string | null;
  authors: { users_name1: string; users_name2: string; users_userid: number }[];
  category: string | null | undefined;
  categoryLink: string | undefined;
  categoryColor: string | undefined;
  imageUrl: string | false;
  articleUrl: string;
  isVertical?: boolean; // Defines if the image is ontop or to the left of the text
  isPortrait: boolean; // Defines if the image is portrait or landscape
  hideCategoryAccent?: boolean;
  textColour?: string;
  baseUrl: string;
  page?: Accessor<number>;
}

const SearchArticle: Component<SearchArticleProps> = (props) => {
  const [loadingDone, setLoadingDone] = createSignal<boolean>(false);
  const imagePlaceHolder =
    "https://bbcdn.nouse.co.uk/file/nousePublicBackendUploads/db/webUploads/public/ARTICLE-THUMBNAIL/mWMFA4fY1ENg25x%20breakingNews_large.jpg";

  const border = () => `border-color-${props.category} border-t-2`;
  const baseUrl = props.baseUrl.length > 0 ? props.baseUrl : "/";

  if (props.page) createEffect(on(props.page, () => setLoadingDone(false)));

  return (
    <div class="h-full overflow-hidden text-ellipsis font-arno">
      <div class={`flex ${props.isVertical ? "flex-col" : "flex-row"}`}>
        {props.imageUrl ? (
          <a
            class={`image-link relative ${
              props.isVertical ? "w-full" : "h-full w-1/2"
            }`}
            href={`${baseUrl}articles${props.articleUrl}`}
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
            href={`${baseUrl}articles${props.articleUrl}`}
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
              class={`text-l arno-display category-color-${props.category} uppercase xl:text-xl 2xl:text-2xl`}
              href={`${baseUrl}${props.categoryLink}`}
            >
              {props.category}
            </a>
          )}
          <div class="mb-2">
            <a class="headline" href={`${baseUrl}articles${props.articleUrl}`}>
              <p class="text-l text-black xl:text-xl 2xl:text-2xl">
                {props.headline}
              </p>
            </a>
            {props.authors.length !== 0 && (
              <p class="text-sm italic text-black 2xl:text-base">
                <span class={`category-color-${props.category}`}>By </span>
                {props.authors.map((author, index) => {
                  if (index === 0) {
                    return (
                      <a href={`${baseUrl}author/${author.users_userid}`}>
                        {`${author.users_name1} ${author.users_name2}`}
                      </a>
                    );
                  } else if (index === props.authors.length - 1) {
                    return (
                      <a href={`${baseUrl}author/${author.users_userid}`}>
                        {` and ${author.users_name1} ${author.users_name2}`}
                      </a>
                    );
                  } else {
                    return (
                      <a href={`${baseUrl}author/${author.users_userid}`}>
                        {`, ${author.users_name1} ${author.users_name2}`}
                      </a>
                    );
                  }
                })}
              </p>
            )}
          </div>
          <a class="excerpt" href={`${baseUrl}articles${props.articleUrl}`}>
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
