import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        baseWhite: "#fafafa",
        baseBlack: "#0a0a0b",
        baseDark: "#181822",
        baseDarkComplementary: "#312F35",
        purple: "#7a45da",
        secondary: "#f5aba1",
        success: "#60d4bb",
        warning: "#f3b661",
        error: "#da5252",
        gradient: {
          1: "#f5aba1",
          2: "#703ae6",
        },
        purpleBG: {
          lighter: "#e9e0f9",
          light: "#bda2ed",
          DEFAULT: "#9064e0",
        },
        darkPurpleBG: {
          lighter: "#4B4B56",
        },
        baseComplementary: "#f4f4ff",
        baseSuccess: {
          100: "#caf1e8",
          300: "#2ea88e",
        },
        baseSecondary: {
          300: "#f8c0b8",
          500: "#ed6755",
        },
      },
      backgroundImage: {
        "gradient-1": "linear-gradient(to right, #f5aba1, #703ae6)",
        "gradient-2": "linear-gradient(to right, #f5aba1, #703ae6)",
      },
      fontFamily: {
        sans: ["var(--font-public-sans)"],
      },
      screens: {
        xs: "480px", // Define the xs breakpoint
      },
    },
  },
  plugins: [],
};
export default config;
