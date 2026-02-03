import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Leasebase Web",
  description: "Leasebase web application frontend"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-4 py-3">
            <div className="mx-auto max-w-5xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide text-slate-200">
                  Leasebase
                </span>
                <span className="text-xs text-slate-400">
                  Web application (Next.js + Tailwind)
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
