"use client";

import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
