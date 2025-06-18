import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
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
    icon(),
    solidJs(),
    sitemap({ customPages: [...articlesLinks, ...categoriesLinks] }),
  ],
  site: "https://yorknouse.github.io",
  base: "/website",
  output: "server",
  // @ts-ignore
  environment,
  vite: {
    plugins: [tailwindcss()],
    server: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      proxy: {
        "/api/searchSuggestions.php": {
          target: "http://localhost:420/api/searchSuggestions.php",
          changeOrigin: true,
        },
        "/api/registerRead": {
          target: "http://localhost:420/api/registerRead",
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
