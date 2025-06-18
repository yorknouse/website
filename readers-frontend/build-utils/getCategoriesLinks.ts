import {
  getMenuCategories,
  getMenuSubcategories,
} from "../src/components/utils/categories";
import baseUrl from "./baseUrl";

export default async function getCategoriesLinks() {
  // Nouse - without home category
  const nouseCategories = (await getMenuCategories("nouse")).slice(1);

  // Muse - without home and nouse categories
  const museCategories = (await getMenuCategories("muse")).slice(1);
  museCategories.pop();

  const nouseLinks = nouseCategories.map(
    (category) => `${baseUrl}${category.categories_name}`,
  );

  const museLinks = museCategories.map(
    (category) => `${baseUrl}muse/${category.categories_name}`,
  );

  const nouseSubCategoriesLinks = await nouseCategories
    .filter((category) => category.categories_name !== "muse")
    .reduce(
      async (accumulator, category) => {
        const acc = await accumulator;
        const subCategories = await getMenuSubcategories(
          category.categories_id,
        );
        acc.push(
          ...subCategories.map(
            (subcategory) =>
              `${baseUrl}${category.categories_name}/${subcategory.categories_name}`,
          ),
        );
        return acc;
      },
      Promise.resolve([] as string[]),
    );

  const museSubCategoriesLinks = await museCategories.reduce(
    async (accumulator, category) => {
      const acc = await accumulator;
      const subCategories = await getMenuSubcategories(category.categories_id);
      acc.push(
        ...subCategories.map(
          (subcategory) =>
            `${baseUrl}muse/${category.categories_name}/${subcategory.categories_name}`,
        ),
      );
      return acc;
    },
    Promise.resolve([] as string[]),
  );

  return [
    ...nouseLinks,
    ...museLinks,
    ...nouseSubCategoriesLinks,
    ...museSubCategoriesLinks,
  ];
}
