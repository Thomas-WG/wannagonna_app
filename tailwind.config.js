/** @type {import('tailwindcss').Config} */
const flowbite = require("flowbite-react/tailwind");

module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.css",
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'], // Adds Roboto as the main font
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite', // Animation for the loading spinner
      },
    },
  },
  plugins: [
    flowbite.plugin(),
  ],
};
