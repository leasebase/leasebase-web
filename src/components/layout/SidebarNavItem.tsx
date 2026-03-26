"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";

export interface SidebarNavItemProps {
  path: string;
  label: string;
  icon?: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

export function SidebarNavItem({
  path,
  label,
  icon,
  active,
  collapsed,
  onClick,
}: SidebarNavItemProps) {
  const link = (
    <Link
      href={path}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
        collapsed ? "justify-center px-2 py-2" : "px-3 py-2.5"
      } ${
        active
          ? "bg-brand-50 font-medium text-brand-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        name={icon || ""}
        size={18}
        className={active ? "text-brand-500" : "text-slate-400 group-hover:text-slate-600"}
      />
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && active && <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
    </Link>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip content={label}>{link}</Tooltip>
      </li>
    );
  }

  return <li>{link}</li>;
}
