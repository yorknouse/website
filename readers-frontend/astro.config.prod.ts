import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import solidJs from "@astrojs/solid-js";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import getArticlesLinks from "./build-utils/getArticlesLinks";
import getCategoriesLinks from "./build-utils/getCategoriesLinks";
const environment = loadEnv(import.meta.env.MODE, process.cwd(), "");

const articlesLinks = await getArticlesLinks();
const categoriesLinks = await getCategoriesLinks();

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    image(),
    solidJs(),
    sitemap({
      customPages: [...articlesLinks, ...categoriesLinks],
    }),
  ],
  site: "https://nouse.co.uk",
  output: "server",
  // @ts-ignore
  environment,
  adapter: node({ mode: "standalone" }),
});
