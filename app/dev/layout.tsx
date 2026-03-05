import type { ReactNode } from "react";

export const metadata = { title: "Dev – LeaseBase", robots: "noindex" };

export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded bg-yellow-600 px-2 py-0.5 text-xs font-bold text-black">
            DEV
          </span>
          <span className="text-sm font-semibold">LeaseBase Component Showcase</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
