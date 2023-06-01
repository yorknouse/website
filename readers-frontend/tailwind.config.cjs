/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        whiteish: { 100: "#F5EFEB", 200: "#D9D9D9" },
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
      },
      aspectRatio: {
        edition: '19/23',
        "portrait-video": 9 / 16,
      },
    },
  },
  plugins: [],
};
