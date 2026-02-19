/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        peach: "#fff5f0",
        beige: "#faf8f5",
        lavender: "#e8dcf8",
        lightGreen: "#d4f0dd",
        softYellow: "#fef7d5",
        softPink: "#ffd6e5",
      },
    },
  },
  plugins: [],
};
