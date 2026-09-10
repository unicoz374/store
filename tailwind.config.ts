import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: { DEFAULT: "#F6F7FB", dark: "#0B0F1E" },
        surface: { DEFAULT: "#FFFFFF", dark: "#12172B" },
        borderc: { DEFAULT: "#E4E6F0", dark: "#232A45" },
        ink: {
          DEFAULT: "#0B0F1E",
          dark: "#EDEFFA",
          muted: "#5B6178",
          mutedDark: "#9BA1BF",
        },
        brand: {
          DEFAULT: "#7C5CFF",
          hover: "#6A47FF",
          soft: "#EFEBFF",
          softDark: "#221C42",
        },
        accent: { cyan: "#22D3EE", amber: "#F5A524", rose: "#FB5B77" },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.25), 0 8px 30px -8px rgba(124,92,255,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
