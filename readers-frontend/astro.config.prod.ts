import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import solidJs from "@astrojs/solid-js";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
// import getArticlesLinks from "./build-utils/getArticlesLinks";
// import getCategoriesLinks from "./build-utils/getCategoriesLinks";
const environment = loadEnv(import.meta.env.MODE, process.cwd(), "");

// const articlesLinks = await getArticlesLinks();
// const categoriesLinks = await getCategoriesLinks();

// https://astro.build/config
export default defineConfig({
  integrations: [
    icon(),
    solidJs(),
    sitemap({
      customPages: [
        /*...articlesLinks, ...categoriesLinks*/
      ],
    }),
  ],
  site: "https://nouse.co.uk",
  output: "server",
  server: {
    headers: {
      "Access-Control-Allow-Origin": "https://nouse.co.uk",
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      headers: {
        "Access-Control-Allow-Origin": "https://nouse.co.uk",
      },
    },
    define: {
      "import.meta.env.PUBLIC_API_BASE_URL": JSON.stringify(
        process.env.PUBLIC_API_BASE_URL || "http://react-container:3000",
      ),
      "import.meta.env.PUBLIC_BASE_URL": JSON.stringify(
        process.env.PUBLIC_BASE_URL || "https://nouse.co.uk",
      ),
    },
  },
  // @ts-ignore
  environment,
  adapter: node({ mode: "standalone" }),
});
