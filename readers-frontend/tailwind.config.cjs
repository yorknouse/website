/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        whiteish: "#f5efeb",
      },
      spacing: {
        81: "21.563rem/* 345px */",
        15: "3.875rem/* 62px */",
      },
      backgroundSize: {
        fill: "100% 100%",
      },
      backgroundImage: {
        logo: "url('https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-full3.svg')",
      },
    },
  },
  plugins: [],
};
