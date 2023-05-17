import { categories, Prisma } from "@prisma/client";
import prisma from "../../prisma";
import type { Page, PaginateOptions } from "astro";
import type { articlesWithArticleDrafts } from "./articles";

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
  return await prisma.categories.findMany({
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
  return await prisma.categories.findMany({
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
            articlesDrafts: { include: { users: true } },
            categories: {
              include: { category: true },
            },
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
  return await prisma.categories.findMany({
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
                include: {
                  users: true,
                },
              },
              categories: {
                include: { category: true },
              },
            },
          },
        },
      },
    },
  });
};

/**
 * Paginates a category
 * @param {categoriesWithArticles} category The main category to paginate.
 * @param {number} articlesPerPage The number of articles per page.
 * @param {string} topLevelCategory The top level category. for example, news, sport, muse
 * @param {string} pathPrefix The prefix to add to the path. For example, campus-news, gaming, music/music-news
 * @returns {PaginateOptions[]} The pagination options for the category.
 */
export const paginateCategory = (
  category: categoriesWithArticles,
  articlesPerPage: number,
  topLevelCategory: string,
  pathPrefix?: string
): PaginateOptions[] => {
  // Get all non-featured articles in the category
  const articles = category.articles
    .filter(
      (article: { article: articlesWithArticleDrafts }) =>
        !category?.categories_featured
          ?.split(",")
          .map(Number)
          .includes(article.article.articles_id)
    )
    .map((article: { article: articlesWithArticleDrafts }) => article.article);

  const paginatedResult: PaginateOptions[] = []; // Array of objects containing the params and props for each page

  /* Muse has a custom landing page where only featured sections are shown
  As such, we need to add an additional page to the pagination just for the muse landing page.
  Similarly if there are no articles in a category, we still need to add a page for the category
  as it might have featured articles */
  let totalPageCount = Math.ceil(articles.length / articlesPerPage); // Total number of pages
  let hasExtraPage = false; // Whether or not there is an extra page for example for the muse landing page
  if (totalPageCount === 0 || category.categories_name === "muse") {
    totalPageCount++;
    hasExtraPage = true;
    paginatedResult.push({
      params: {
        topLevelCategory: topLevelCategory,
        path: pathPrefix ? `${pathPrefix}` : undefined,
      },
      props: {
        title: category.categories_displayName,
        category: category,
        style:
          category.categories_nestUnder === 4 ||
          topLevelCategory === "muse" ||
          category.categories_name === "muse"
            ? "muse"
            : "nouse",
        paginatorPrefix: pathPrefix
          ? `${topLevelCategory}/${pathPrefix}`
          : topLevelCategory,
        page: {
          currentPage: 0,
          total: totalPageCount,
          size: 0,
        } as Page,
      },
    });
  }

  for (let i = 0; i < Math.ceil(articles.length / articlesPerPage); i++) {
    const start = i * articlesPerPage;
    const end = start + articlesPerPage;
    const currentPage = hasExtraPage ? i + 1 : i;
    paginatedResult.push({
      params: {
        topLevelCategory: topLevelCategory,
        path: pathPrefix
          ? `${pathPrefix}${currentPage == 0 ? "" : `/${currentPage + 1}`}`
          : currentPage == 0
          ? undefined
          : `${currentPage + 1}`,
      },
      props: {
        title: category.categories_displayName,
        category: category,
        style:
          category.categories_nestUnder === 4 ||
          topLevelCategory === "muse" ||
          category.categories_name === "muse"
            ? "muse"
            : "nouse",
        paginatorPrefix: pathPrefix
          ? `${topLevelCategory}/${pathPrefix}`
          : topLevelCategory,
        page: {
          data: articles.slice(start, end),
          currentPage: currentPage,
          total: totalPageCount,
          size: articlesPerPage,
        } as Page,
      },
    });
  }
  return paginatedResult;
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