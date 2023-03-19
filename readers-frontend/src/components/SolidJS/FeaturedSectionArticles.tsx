import type { articlesWithArticleDrafts } from "@components/utils/articles";
import { Component, For } from "solid-js";

type FeaturedSectionArticlesProps = {
    articles: articlesWithArticleDrafts[];
}

const FeaturedSectionArticles: Component<FeaturedSectionArticlesProps> = (props) => (
    <For each={props.articles}>
        {
            (article, i) => (
                <>
                    {/* Desktop */}
                </>
            )
        }
    </For>
)

export default FeaturedSectionArticles;