import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEVEL UP 2027",
  description: "Private personal Life Operating System",
  applicationName: "LEVEL UP",
  appleWebApp: { capable: true, title: "LEVEL UP", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-ink-950">
      <body className="min-h-dvh bg-ink-950 font-sans text-white">{children}</body>
    </html>
  );
}
