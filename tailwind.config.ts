import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        baseWhite: "#fafafa",
        baseBlack: "#0a0a0b",
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
        baseComplementary: "#f4f4ff",
        lightBlueBG: "#d2d2f7",
        baseSuccess: {
          300: "#2ea88e"
        }
      },
      backgroundImage: {
        "gradient-1": "linear-gradient(to right, #f5aba1, #703ae6)",
        "gradient-2": "linear-gradient(to right, #f5aba1, #703ae6)",
      },
      fontFamily: {
        sans: ["var(--font-public-sans)"],
      },
    },
  },
  plugins: [],
};
export default config;
