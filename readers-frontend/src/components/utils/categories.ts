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

export const getMainArticleCategory = async (
  categoryIds: number[] | undefined,
  style: "nouse" | "muse"
): Promise<categories | null> => {
  return await prisma.categories.findFirst({
    where: {
      categories_id: {
        in: categoryIds,
      },
      categories_showHome: true,
      categories_showPublic: true,
      categories_backgroundColor: {
        not: null,
      },
      categories_nestUnder: style === "nouse" ? null : 4,
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
        article: { include: { articlesDrafts: { include: { users: true } } } },
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
            },
          },
        },
      },
    },
  });
};

/**
 * Paginates a category
 * @param {categoriesWithArticles} category The parent or main category to paginate.
 * @param {categoriesWithArticles} subCategory The subcategory to paginate.
 * @param {number} paginationOffset The offset to start at.
 * Note: If subCategory is provided, subCategory is paginated with respect to category being the parent.
 * @returns {any} Promise object represents the articles.
 */
export const paginateCategory = (
  category: categoriesWithArticles,
  subCategory?: categoriesWithArticles,
  paginationOffset: number = 0
): any => {
  // Split articles into rows of 2
  const articleRows = category.articles
    .filter(
      (article: { article: articlesWithArticleDrafts }) =>
        !category?.categories_featured
          ?.split(",")
          .map(Number)
          .includes(article.article.articles_id)
    )
    .map((article: { article: articlesWithArticleDrafts }) => article.article)
    .reduce(
      (
        accumulator: articlesWithArticleDrafts[][],
        currentValue: any,
        currentIndex: number,
        array: articlesWithArticleDrafts[]
      ) => {
        if (currentIndex % 2 === 0) {
          accumulator.push(array.slice(currentIndex, currentIndex + 2));
        }
        return accumulator;
      },
      []
    );

  const paginatedResult = [];
  for (let i = 0; i < Math.ceil(articleRows.length / 15); i++) {
    const start = i * 15;
    const end = start + 15;
    const pageNumber = i + paginationOffset + 1;
    if (subCategory) {
      // Paginates the subcategory
      paginatedResult.push({
        params: {
          category: category.categories_name,
          path: `${subCategory.categories_name}${
            pageNumber == 1 ? "" : `/${pageNumber}`
          }`,
        },
        props: {
          title: subCategory.categories_displayName,
          category: subCategory,
          style: category.categories_nestUnder === 4 ? "muse" : "nouse",
          page: {
            data: articleRows.slice(start, end),
            currentPage: pageNumber,
          } as Page,
        },
      });
    } else {
      paginatedResult.push({
        // Paginates the top level category
        params: {
          category: category.categories_name,
          path: pageNumber == 1 ? undefined : pageNumber,
        },
        props: {
          title: category.categories_displayName,
          category: category,
          style:
            category.categories_nestUnder === 4 ||
            category.categories_name === "muse"
              ? "muse"
              : "nouse",
          page: {
            data: articleRows.slice(start, end),
            currentPage: pageNumber,
          } as Page,
        },
      });
    }
  }
  return paginatedResult;
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
