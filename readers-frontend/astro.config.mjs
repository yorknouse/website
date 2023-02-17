import { defineConfig } from 'astro/config';
import { loadEnv } from "vite";

// https://astro.build/config
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
const environment = loadEnv(import.meta.env.MODE, process.cwd(), "");
// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), image()],
  site: 'https://yorknouse.github.io',
  base: '/website',
  environment
});