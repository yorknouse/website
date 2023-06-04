export type MuseNavbarCategory = {
  displayName: string;
  name: string;
};

export type SearchResult = {
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
  articles_authors: {
    users_name1: string;
    users_name2: string;
    users_userid: number;
  }[];
};

export type SearchResponse = {
  response: SearchResult[];
  result: boolean;
};

export type TopArticleResult = {
  articles_id: number;
  articlesDrafts_headline: string;
  articles_isThumbnailPortrait: boolean;
  articles_published: string;
  articles_slug: string;
  articles_thumbnail: string;
  categories_name: string;
  image: false | string;
  url: string;
  articles_authors: {
    users_name1: string;
    users_name2: string;
    users_userid: number;
  }[];
};

export type TopArticlesResponse = {
  response: TopArticleResult[];
  result: boolean;
};
