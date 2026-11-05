import type { Metadata, Viewport } from "next";
import "./globals.css";
import { themeScript } from "@/components/shell/ThemeToggle";

export const metadata: Metadata = {
  title: { default: "MoneyFlow", template: "%s · MoneyFlow" },
  description: "Personal finance dashboard built around biweekly paychecks.",
  appleWebApp: { capable: true, title: "MoneyFlow", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1110" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
