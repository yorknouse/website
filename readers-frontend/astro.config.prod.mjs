import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import solidJs from "@astrojs/solid-js";
import node from "@astrojs/node";
const environment = loadEnv(import.meta.env.MODE, process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), image(), solidJs()],
  site: "https://nouse.co.uk",
  output: "server",
  environment,
  adapter: node({ mode: "standalone" }),
});
