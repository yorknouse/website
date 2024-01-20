import type { AstroIntegration } from "astro";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const generateCategoryStyle = (colour: string, name: string) => {
  return `.category-color-${name} {color: ${colour};} .border-color-${name} {border-color: ${colour};}`;
};

const createPlugin = (): AstroIntegration => ({
  name: "computed-styles-integration",
  hooks: {
    "astro:config:setup": async ({ injectScript }) => {
      // Don't use shared client here, as integration should be standalone
      const prisma = new PrismaClient();

      const fileName = "computed-category-styles.css";

      // Grab all categories with a defined colour
      const categoriesColours = await prisma.categories.findMany({
        select: {
          categories_backgroundColor: true,
          categories_name: true,
        },
        where: {
          NOT: {
            categories_backgroundColor: null,
          },
        },
      });

      // Create css file content
      const fileContent = categoriesColours.reduce((acc, cat) => {
        if (acc) {
          acc += "\n";
        }

        acc += generateCategoryStyle(
          cat.categories_backgroundColor!,
          cat.categories_name
        );

        return acc;
      }, "");

      writeFileSync(fileName, fileContent, "utf-8");

      // This will add the import to every page for Vite to optimise
      injectScript("page-ssr", `import "${fileName}";`);
    },
  },
});

export default createPlugin;
