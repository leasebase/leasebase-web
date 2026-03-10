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
      className={`flex items-center gap-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
        collapsed ? "justify-center px-2 py-2" : "px-2.5 py-2"
      } ${
        active
          ? "bg-brand-500/10 font-medium text-brand-600"
          : "text-slate-600 hover:bg-surface-raised hover:text-slate-900"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        name={icon || ""}
        size={18}
        className={active ? "text-brand-600" : ""}
      />
      {!collapsed && <span>{label}</span>}
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
