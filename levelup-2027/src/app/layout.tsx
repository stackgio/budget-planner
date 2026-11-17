import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { SPLASH_SCREENS, splashMedia } from "@/domain/splash";

export const metadata: Metadata = {
  title: "LEVEL UP 2027",
  description: "Private personal Life Operating System",
  applicationName: "LEVEL UP",
  appleWebApp: {
    capable: true, title: "LEVEL UP", statusBarStyle: "black-translucent",
    startupImage: SPLASH_SCREENS.map((s) => ({ url: `/splash/${s.name}-portrait.png`, media: splashMedia(s) })),
  },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the request headers renders every page per request, so each one gets the CSP nonce.
  await headers();
  return (
    <html lang="en" className="bg-ink-950">
      <body className="min-h-dvh bg-ink-950 font-sans text-white">{children}</body>
    </html>
  );
}
