import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#E8F2FB",
          100: "#C5DCEF",
          200: "#9DC3E4",
          300: "#74AAD8",
          400: "#4B91CD",
          500: "#1A6FBB",
          600: "#0D4F8A",
          700: "#0A3D6B",
          800: "#072A4C",
          900: "#03182D",
        },
        success: {
          50:  "#E8F8EE",
          500: "#27AE60",
          700: "#1A7A42",
        },
        warning: {
          50:  "#FEF3E2",
          500: "#E67E22",
        },
        danger: {
          50:  "#FDECEC",
          500: "#E53E3E",
        },
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
