import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#08090A", 900: "#0E0F11", 850: "#141518", 800: "#1A1C20", 700: "#25282D", 600: "#33373E", 500: "#4A4F57" },
        mute: { 400: "#9AA0A8", 300: "#B9BEC5" },
        go: { DEFAULT: "#2BEA7A", 600: "#1FC463", 900: "#0E3A22" },
        warn: "#F5B53D",
        bad: "#FF6B6B",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Inter", "Segoe UI", "Roboto", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "sans-serif"],
      },
      fontVariantNumeric: { tabular: "tabular-nums" },
    },
  },
  plugins: [],
} satisfies Config;
