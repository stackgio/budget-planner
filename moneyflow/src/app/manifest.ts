import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoneyFlow",
    short_name: "MoneyFlow",
    description: "Personal finance built around biweekly paychecks",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f7",
    theme_color: "#059669",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
