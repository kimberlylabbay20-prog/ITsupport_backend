/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0C1B2E",
          800: "#10243E",
          700: "#162D50",
          600: "#1C3A62",
        },
        primary: {
          50: "#EAF4FC",
          100: "#D5E9F9",
          200: "#ABD3F3",
          300: "#81BDed",
          400: "#57A7E7",
          500: "#1677D2",
          600: "#1260A8",
          700: "#0E487E",
          800: "#093054",
          900: "#05182A",
        },
        page: {
          bg: "#EAF4FC",
          light: "#F2F8FD",
        },
        text: {
          dark: "#172033",
          muted: "#6B7785",
          light: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
