import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Facebook Auto Bot",
  description: "Generate and auto-post optimized Facebook Page posts from any topic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <ThemeInit />
      </head>
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
