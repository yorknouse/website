import type {
  IArticleCategory,
  ICategory,
  ICategoryArticles,
} from "@components/types.ts";

const apiBase = import.meta.env.PUBLIC_API_BASE_URL;

export const getMenuCategories: (
  style: "nouse" | "muse",
) => Promise<ICategory[]> = async (
  style: "nouse" | "muse",
): Promise<ICategory[]> => {
  const res = await fetch(`${apiBase}/api/frontend/menuCategories/${style}`);
  return await res.json();
};

/**
 * Gets all sub-categories nested under a parent category.
 * Only retrieves category marked for menu usage (categories_showMenu: true).
 * @param {number} parentCategory The parent category to get submenus for
 * @returns {Promise<ICategory[]>} Promise object represents the subcategories
 */
export const getMenuSubcategories: (
  parentCategory: number,
) => Promise<ICategory[]> = async (parentCategory: number) => {
  const res = await fetch(
    `${apiBase}/api/frontend/menuSubcategories/${parentCategory}`,
  );
  return await res.json();
};

export const getFeaturedSectionsCategories: () => Promise<
  ICategory[]
> = async (): Promise<ICategory[]> => {
  const res = await fetch(`${apiBase}/api/frontend/featuredSectionCategories`);
  return await res.json();
};

/**
 * Gets all the categories and their articles.
 * @param {number | null} parentCategory The parent category to get the children of.
 * @param articlesLimit indicates the limit for how many articles are gathered
 * @returns {Promise<ICategoryArticles[]>} Promise object represents the categories and their articles.
 */
export const getCategoriesWithArticles = async (
  parentCategory?: number | null,
  articlesLimit: number = 10,
): Promise<ICategoryArticles[]> => {
  const res = await fetch(
    `${apiBase}/api/frontend/categoriesWithArticles?parentCategory=${parentCategory}&articlesLimit=${articlesLimit}`,
  );
  return await res.json();
};

/**
 * Gets the link for a category
 * @param {string} category_name The name of the category.
 * @param {number | null} parentCategory The parent category to get the children of.
 * @returns {string} The link for the category.
 */
export const getCategoryLink = (
  category_name: string,
  parentCategory: number | null,
): string => {
  if (parentCategory === 4) {
    return `/muse/${category_name}`;
  } else {
    return `/${category_name}`;
  }
};

type ArticleCategories = IArticleCategory & {
  category: ICategory;
};

/**
 * Extrapolates the "parent" category from a list of categories
 * @param categories
 * @returns
 */
export const getParentCategory = (categories: ArticleCategories[]) => {
  // I think categories commonly come from the backend as:
  // Top - Middle - Bottom for examples. Where Bottom is nested
  // under Middle and Top is an "extra category". Hence, the reverse,
  // trying to find related ones.
  const interimParentCategory = categories
    .slice()
    .reverse()
    .find(
      ({ category }) =>
        category.categories_showPublic &&
        ((category.categories_nestUnder === null && // Nouse
          category.categories_id !== 4) ||
          category.categories_nestUnder === 4), // Muse
    );

  if (interimParentCategory) {
    if (
      // This is mainly for Muse articles as they are
      // always going to have the Muse category listed
      categories.length < 3 ||
      categories.find(
        ({ category }) =>
          category.categories_nestUnder ===
          interimParentCategory.category.categories_id,
      )
    )
      return interimParentCategory.category;
  }

  return categories[0].category;
};
