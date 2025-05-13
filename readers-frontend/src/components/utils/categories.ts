import {
  type articlesCategories,
  type categories,
  Prisma,
} from "@prisma/client";
import prisma from "../../prisma";

export const getMenuCategories = async (
  style: "nouse" | "muse"
): Promise<categories[]> => {
  let menuCategories: categories[];

  if (style === "nouse") {
    menuCategories = await prisma.categories.findMany({
      where: {
        categories_showMenu: true,
        categories_showPublic: true,
        categories_nestUnder: null,
      },
    });

    // Add home as first item - possibly need to adjust values in the future
    menuCategories.unshift({
      categories_name: "home",
      categories_id: 0,
      categories_showHome: true,
      categories_displayName: "Home",
      categories_showMenu: true,
      categories_showPublic: true,
      categories_showAdmin: true,
      categories_featured: null,
      categories_order: null,
      categories_nestUnder: null,
      categories_showSub: false,
      categories_facebook: null,
      categories_twitter: null,
      categories_instagram: null,
      categories_backgroundColor: null,
      categories_backgroundColorContrast: null,
      categories_customTheme: null,
      categories_socialMediaOverlay: null,
    });

    // Muse to last
    menuCategories = menuCategories.sort((a, b) => {
      if (b.categories_name === "muse") return -1;
      if (a.categories_name === "muse") return 1;

      return 0;
    });
  } else {
    menuCategories = await prisma.categories.findMany({
      where: {
        categories_showMenu: true,
        categories_showPublic: true,
        categories_nestUnder: 4, // Muse
      },
    });

    const muse = await prisma.categories.findFirst({
      where: {
        categories_name: "muse",
      },
    });

    if (menuCategories.length > 0 && muse) {
      // Add home as first item - possibly need to adjust values in the future
      menuCategories.unshift({
        ...muse,
        categories_displayName: "Home",
      });

      // Link to Nouse home
      menuCategories.push({
        categories_name: "nouse",
        categories_id: 0,
        categories_showHome: true,
        categories_displayName: "Nouse",
        categories_showMenu: true,
        categories_showPublic: true,
        categories_showAdmin: true,
        categories_featured: null,
        categories_order: null,
        categories_nestUnder: null,
        categories_showSub: false,
        categories_facebook: null,
        categories_twitter: null,
        categories_instagram: null,
        categories_backgroundColor: null,
        categories_backgroundColorContrast: null,
        categories_customTheme: null,
        categories_socialMediaOverlay: null,
      });
    }
  }

  return menuCategories;
};

/**
 * Gets all sub-categories nested under a parent category.
 * Only retrieves category marked for menu usage (categories_showMenu: true).
 * @param {number} parentCategory The parent category to get submenus for
 * @returns {Promise<categories[]>} Promise object represents the subcategories
 */
export const getMenuSubcategories = async (parentCategory: number) => {
  return prisma.categories.findMany({
    where: {
      categories_showMenu: true,
      categories_showPublic: true,
      categories_nestUnder: parentCategory,
    },
  });
};

export const getFeaturedSectionsCategories = async (): Promise<
  categories[]
> => {
  return prisma.categories.findMany({
    where: {
      categories_showHome: true,
      categories_showPublic: true,
      categories_nestUnder: null,
      NOT: {
        categories_name: "muse",
      },
      categories_featured: {
        not: null,
      },
    },
  });
};

const categoriesWithArticles = Prisma.validator<Prisma.categoriesArgs>()({
  include: {
    articles: {
      include: {
        article: {
          include: {
            articlesDrafts: true,
            categories: {
              include: { category: true },
            },
            users: { include: { users: true } },
          },
        },
      },
    },
  },
});

export type categoriesWithArticles = Prisma.categoriesGetPayload<
  typeof categoriesWithArticles
>;

/**
 * Gets all the categories and their articles.
 * @param {number | null} parentCategory The parent category to get the children of.
 * @returns {Promise<categoriesWithArticles[]>} Promise object represents the categories and their articles.
 */
export const getCategoriesWithArticles = async (
  parentCategory?: number | null
): Promise<categoriesWithArticles[]> => {
  return prisma.categories.findMany({
    where: {
      categories_showPublic: true,
      categories_showMenu: true,
      categories_nestUnder: parentCategory,
    },
    include: {
      articles: {
        where: {
          article: {
            articles_showInLists: true,
          },
        },
        orderBy: {
          article: {
            articles_published: "desc",
          },
        },
        include: {
          article: {
            include: {
              articlesDrafts: {
                orderBy: {
                  articlesDrafts_timestamp: "desc",
                },
                take: 1,
              },
              categories: {
                include: { category: true },
              },
              users: { include: { users: true } },
            },
          },
        },
      },
    },
  });
};

/**
 * Gets the link for a category
 * @param {string} category_name The name of the category.
 * @param {number | null} parentCategory The parent category to get the children of.
 * @returns {string} The link for the category.
 */
export const getCategoryLink = (
  category_name: string,
  parentCategory: number | null
): string => {
  if (parentCategory === 4) {
    return `${import.meta.env.BASE_URL}muse/${category_name}`;
  } else {
    return `${import.meta.env.BASE_URL}${category_name}`;
  }
};

type ArticleCategories = articlesCategories & {
  category: categories;
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
          category.categories_nestUnder === 4) // Muse
    );

  if (interimParentCategory) {
    if (
      // This is mainly for Muse articles as they are
      // always going to have the Muse category listed
      categories.length < 3 ||
      categories.find(
        ({ category }) =>
          category.categories_nestUnder ===
          interimParentCategory.category.categories_id
      )
    )
      return interimParentCategory.category;
  }

  return categories[0].category;
};
