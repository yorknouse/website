import type { categories } from "@prisma/client";
import prisma from "../../prisma";

export const getMenuCategories = async (
  style: "nouse" | "muse"
): Promise<categories[]> => {
  let menuCategories: categories[];

  if (style === "nouse") {
    menuCategories = await prisma.categories.findMany({
      where: {
        categories_showMenu: true,
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
        categories_nestUnder: 4, // Muse
      },
    });

    if (menuCategories.length > 0) {
      // Change category name to home for muse
      menuCategories[0].categories_name = "home";
      menuCategories[0].categories_displayName = "Home";

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
  categoryIds: number[] | undefined
): Promise<categories | null> => {
  return await prisma.categories.findFirst({
    where: {
      categories_id: {
        in: categoryIds,
      },
      categories_showHome: true,
      categories_backgroundColor: {
        not: null,
      },
    },
  });
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
