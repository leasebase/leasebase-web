"use client";

import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** When true, pins the header to the top of the nearest scroll container. */
  sticky?: boolean;
}

export function PageHeader({ title, description, actions, sticky = false }: PageHeaderProps) {
  const stickyClasses = sticky
    ? "sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white border-b border-slate-200 shadow-sm"
    : "";

  return (
    <header className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between ${stickyClasses}`}>
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="mt-0.5 text-[13px] text-slate-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 mt-2 sm:mt-0">{actions}</div>}
    </header>
  );
}
