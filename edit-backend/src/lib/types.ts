import type { articlesWithArticleDrafts } from "@/lib/articles";

export interface MuseNavbarCategory {
  displayName: string;
  name: string;
}

export interface ArticleAuthor {
  users_name1: string;
  users_name2: string;
  users_userid: number;
}

export interface SearchResult {
  articlesDrafts_excerpt: string;
  articlesDrafts_headline: string;
  articles_id: number;
  articles_isThumbnailPortrait: boolean;
  articles_published: string;
  articles_slug: string;
  articles_thumbnail: string;
  categories_backgroundColor: string;
  categories_displayName: string;
  categories_name: string;
  image: false | string;
  url: string;
  articles_authors: ArticleAuthor[];
}

export interface SearchResponse {
  response: SearchResult[];
  result: boolean;
}

export interface TopArticleResult {
  articles_id: number;
  articlesDrafts_headline: string;
  articles_isThumbnailPortrait: boolean;
  articles_published: Date | null;
  articles_slug: string;
  articles_thumbnail: string;
  categories_name: string;
  articles_displayImages: boolean;
  image: false | string;
  url: string;
  articles_authors: ArticleAuthor[];
}

export interface TopArticlesResponse {
  response: TopArticleResult[];
  result: boolean;
}

export type FeaturedHighlights = {
  sections: FeaturedHighlightsSection[];
} | null;

export interface FeaturedHighlightsSection {
  name: string;
  headerImage: number;
  customBoxes: {
    type?: string;
    text: string;
    title: string;
  }[];
  customBoxHeader: {
    type?: string;
    text: string;
    title: string;
  };
  articles: string[];
  articlesData: articlesWithArticleDrafts[];
}

export interface PositionMember {
  users_userid: number;
  users_name1: string;
  users_name2: string;
  users_googleAppsUsernameNouse: string;
}

export interface Position {
  positions_id: number;
  positions_teamPageGroup: number;
  positions_displayName: string;
  users: PositionMember[];
}

export interface IArticle {
  id: number;
  headline: string | null;
  excerpt: string | null;
  text: string | null;
  articleURL: string;
  thumbnailURL: string;
  isThumbnailPortrait: boolean;
  displayImages: boolean;
  thumbnailCredit: string | null;
  articleType: number | null;
  published: string | null;
  parentCategory: ArticleCategory;
  categories: ArticleCategory[] | null;
  authors: ArticleAuthor[];
  similarArticles: IArticle[] | null;
}

export interface IArticleFull {
  id: number;
  headline: string | null;
  excerpt: string | null;
  text: string | null;
  articleURL: string;
  thumbnailURL: string;
  isThumbnailPortrait: boolean;
  thumbnailCredit: string | null;
  articleType: number | null;
  published: string | null;
  parentCategory: ArticleCategory;
  categories: ICategory[] | null;
  authors: ArticleAuthor[];
  similarArticles: IArticle[] | null;
  displayImages: boolean;
}

export interface IAuthorArticles {
  pages: number;
  articles: IArticle[];
}

export interface IEdition {
  editions_id: number;
  editions_name: string;
  editions_excerpt: string | null;
  editions_slug: string;
  editions_printNumber: number | null;
  editions_deleted: boolean;
  editions_published: Date;
  editions_show: boolean;
  editions_showHome: boolean;
  editions_thumbnail: number | null;
  editions_headerImage: number | null;
  editions_pdf: number | null;
  editions_pdfOriginal: number | null;
  editions_featuredHighlights: string | null;
  editions_type: string | null;
}

export interface IFeaturedHome {
  id: number;
  articles: string | null;
  timestamp: Date;
}

export interface ArticleCategory {
  id: number;
  name: string | null;
  displayName: string | null;
  colour: string | null;
  link: string | null;
  nestUnder: number | null;
}

export interface ICategory {
  categories_id: number;
  categories_showHome: boolean;
  categories_displayName: string | null;
  categories_showMenu: boolean;
  categories_name: string;
  categories_showPublic: boolean;
  categories_showAdmin: boolean;
  categories_featured: string | null;
  categories_order: boolean | null;
  categories_nestUnder: number | null;
  categories_showSub: boolean;
  categories_facebook: string | null;
  categories_twitter: string | null;
  categories_instagram: string | null;
  categories_backgroundColor: string | null;
  categories_backgroundColorContrast: string | null;
  categories_customTheme: string | null;
  categories_socialMediaOverlay: string | null;
}

export interface ICategoryArticles {
  categories_id: number;
  categories_showHome: boolean;
  categories_displayName: string | null;
  categories_showMenu: boolean;
  categories_name: string;
  categories_showPublic: boolean;
  categories_showAdmin: boolean;
  categories_featured: string | null;
  categories_order: boolean | null;
  categories_nestUnder: number | null;
  categories_showSub: boolean;
  categories_facebook: string | null;
  categories_twitter: string | null;
  categories_instagram: string | null;
  categories_backgroundColor: string | null;
  categories_backgroundColorContrast: string | null;
  categories_customTheme: string | null;
  categories_socialMediaOverlay: string | null;
  articles: IArticleFull[] | null;
}

export interface IArticleCategory {
  articles_id: number;
  categories_id: number;
}
