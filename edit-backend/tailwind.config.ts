export default {
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
        playfair: [
          "playfair-display",
          "ui-serif",
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "Times",
          "serif",
        ],
      },
      aspectRatio: {
        edition: "19/23",
        "portrait-video": 9 / 16,
      },
    },
  },
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
};
