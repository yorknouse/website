/* MuseNavbar category item*/
export type MuseNavbarCategory = {
  displayName: string;
  name: string;
};

/* Article props */
export type ArticleProps = {
  headline: string;
  excerpt: string | null;
  author: string;
  authorId: number | undefined;
  category: string | undefined;
  categoryColor: string | undefined;
  imageUrl: string;
  articleUrl: string;
  isVertical?: boolean; // Defines if the image is ontop or to the left of the text
  isPortrait: boolean; // Defines if the image is portrait or landscape
};
