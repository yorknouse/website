import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import solidJs from "@astrojs/solid-js";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
// import getCategoriesLinks from "./build-utils/getCategoriesLinks";
// import getArticlesLinks from "./build-utils/getArticlesLinks";
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
  site: "https://yorknouse.github.io",
  base: "/",
  output: "server",
  // @ts-ignore
  environment,
  vite: {
    plugins: [tailwindcss()],
    server: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
    define: {
      'import.meta.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || 'http://localhost:3000')
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
