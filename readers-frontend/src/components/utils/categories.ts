import { categories, Prisma } from "@prisma/client";
import type { Page } from "astro";
import prisma from "../../prisma";
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

export const getCategories = async (
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
              categories: true,
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
 * @returns {any} Promise object represents the articles.
 */
export const paginateCategory = (
  category: categoriesWithArticles,
  articlesPerPage: number,
  topLevelCategory: string,
  pathPrefix?: string
): any => {
  // Split articles into rows of 2
  const articles = category.articles
    .filter(
      (article: { article: articlesWithArticleDrafts }) =>
        !category?.categories_featured
          ?.split(",")
          .map(Number)
          .includes(article.article.articles_id)
    )
    .map((article: { article: articlesWithArticleDrafts }) => article.article);

  const paginatedResult = []; // Array of objects containing the params and props for each page

  // Muse has a custom landing page where only featured sections are shown
  // As such, we need to add an additional page to the pagination just for the muse landing page
  const totalPageCount =
    category.categories_name === "muse"
      ? Math.ceil(articles.length / articlesPerPage) + 1
      : Math.ceil(articles.length / articlesPerPage);
  for (let i = 0; i < Math.ceil(articles.length / articlesPerPage); i++) {
    const start = i * articlesPerPage;
    const end = start + articlesPerPage;
    paginatedResult.push({
      params: {
        topLevelCategory: topLevelCategory,
        path: pathPrefix
          ? `${pathPrefix}${i == 0 ? "" : `/${i + 1}`}`
          : i == 0
          ? undefined
          : i + 1,
      },
      props: {
        title: category.categories_displayName,
        category: category,
        style:
          category.categories_nestUnder === 4 ||
          category.categories_name === "muse"
            ? "muse"
            : "nouse",
        paginatorPrefix: pathPrefix
          ? `${topLevelCategory}/${pathPrefix}`
          : topLevelCategory,
        page: {
          data:
            category.categories_name === "muse" && i === 0
              ? []
              : articles.slice(start, end),
          currentPage: i,
          total: totalPageCount,
          size: articlesPerPage,
        } as Page,
      },
    });
  }
  return paginatedResult;
};

export const getCategoryLink = (
  category_name: string,
  category_nestUnder: number | null
): string => {
  if (category_nestUnder === 4) {
    return `${import.meta.env.BASE_URL}muse/${category_name}`;
  } else {
    return `${import.meta.env.BASE_URL}${category_name}`;
  }
};
// Construct nested items map - saved for later
// let nestedItems = menuCategories.reduce((accumulator, category, _) => {
//   const parent = category.categories_nestUnder;
//   if (parent !== null) {
//     let subCategories = accumulator.get(parent);

//     if (!subCategories) subCategories = [];

//     subCategories.push(category);

//     accumulator.set(parent, subCategories);
//   }
//   return accumulator;
// }, new Map<number, categories[]>());
