import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        brand: { DEFAULT: "rgb(var(--brand) / <alpha-value>)", soft: "rgb(var(--brand-soft) / <alpha-value>)", fg: "rgb(var(--brand-fg) / <alpha-value>)" },
        warn: "rgb(var(--warn) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
      },
      fontFamily: { sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"] },
      borderRadius: { xl: "14px", "2xl": "20px" },
      keyframes: { "fade-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } } },
      animation: { "fade-up": "fade-up .35s ease-out both" },
    },
  },
  plugins: [],
} satisfies Config;
