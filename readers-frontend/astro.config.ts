import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import solidJs from "@astrojs/solid-js";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import getCategoriesLinks from "./build-utils/getCategoriesLinks";
import getArticlesLinks from "./build-utils/getArticlesLinks";
const environment = loadEnv(import.meta.env.MODE, process.cwd(), "");

const articlesLinks = await getArticlesLinks();
const categoriesLinks = await getCategoriesLinks();

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    image(),
    solidJs(),
    sitemap({ customPages: [...articlesLinks, ...categoriesLinks] }),
  ],
  site: "https://yorknouse.github.io",
  base: "/website",
  output: "server",
  // @ts-ignore
  environment,
  vite: {
    server: {
      proxy: {
        "/api/searchSuggestions.php": {
          target: "http://localhost:420/api/searchSuggestions.php",
          changeOrigin: true,
        },
        "/api/registerRead.php": {
          target: "http://localhost:420/api/registerRead.php",
          changeOrigin: true,
        },
        "/api/topArticles.php": {
          target: "http://localhost:420/api/topArticles.php",
          changeOrigin: true,
        },
      },
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
