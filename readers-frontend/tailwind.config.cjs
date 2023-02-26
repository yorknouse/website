/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        whiteish: { 100: "#F5EFEB", 200: "#D9D9D9" },
        categoryRed: "#E4362D",
        categoryOchre: "#EDB321",
        categoryGreen: "#019940",
        categoryBlue: "#3B82B8",
        categoryDarkBlue: "#2B4988",
        categoryLilla: "#797CAF",
        categoryPurple: "#932E6C",
      },
      fontFamily: {
        arno: [
          "arno-pro",
          "ui-serif",
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "Times",
          "serif",
        ],
        arnoDisplay: ["arno-pro-display", "serif"],
      },
      aspectRatio: {
        edition: 602 / 733,
      },
    },
  },
  plugins: [],
};
