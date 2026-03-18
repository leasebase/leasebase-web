import "./globals.css";
import type { Metadata, Viewport } from "next";
import React, { Suspense } from "react";
import { Inter } from "next/font/google";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeaseBase",
  description: "LeaseBase web application frontend",
  icons: {
    icon: [{ url: "/assets/brand/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/assets/brand/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/assets/brand/favicon.svg", type: "image/svg+xml" }],
  },
};
export const viewport: Viewport = {
  themeColor: "#18D7F0",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Suspense fallback={null}>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
