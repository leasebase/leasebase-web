import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — LeaseBase",
  description: "LeaseBase legal documents",
};

/**
 * Public layout for /legal/* pages.
 * No authentication required. Clean, branded reading layout.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-6 py-4">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              LB
            </span>
            <span className="text-lg font-semibold tracking-wide text-slate-800">
              LeaseBase
            </span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} LeaseBase Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
