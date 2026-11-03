import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui";
import { DevPanel } from "@/components/DevPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finvora",
  description: "Learn money, investing and Nigerian markets in short, interactive lessons.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#5B21B6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <a href="#main" className="sr" style={{ position: "absolute" }}>Skip to content</a>
        <ToastProvider>
          {children}
          <DevPanel />
        </ToastProvider>
      </body>
    </html>
  );
}
