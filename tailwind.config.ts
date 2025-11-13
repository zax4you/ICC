import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0d0d0f",
        bg2: "#161618",
        card: "#1d1d20",
        border: "#28282b",
        text1: "#f4f4f5",
        text2: "#c8c8cc",
        accent: "#4ade80" // soft green
      }
    }
  },
  plugins: []
};

export default config;
