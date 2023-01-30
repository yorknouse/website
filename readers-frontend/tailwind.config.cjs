/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        whiteish: "#f5efeb",
      },
      spacing: {
        15: "3.875rem/* 62px */",
        17: "4.438rem/* 71px */",
        71: "17.688rem/* 283px */",
        81: "21.563rem/* 345px */",
      },
      backgroundSize: {
        fill: "100% 100%",
      },
      backgroundImage: {
        "nouse-logo":
          "url('https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-full3.svg')",
        "muse-logo":
          "url('https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/MUSE%20Logo%20White%20small.png')",
      },
    },
  },
  plugins: [],
};
