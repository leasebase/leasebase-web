import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-1.5 text-xs font-medium hover:bg-slate-800/80 hover:text-slate-50 ${
        active ? "bg-slate-800 text-slate-50" : "text-slate-300"
      }`}
    >
      {label}
    </Link>
  );
}

export default function PmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-6">
      <aside className="w-52 shrink-0 border-r border-slate-800 pr-4">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Management
        </div>
        <nav className="space-y-1">
          <NavLink href="/pm" label="Dashboard" />
          <NavLink href="/pm/properties" label="Properties" />
          <NavLink href="/pm/leases" label="Leases" />
          <NavLink href="/pm/work-orders" label="Work orders" />
          <NavLink href="/pm/documents" label="Documents" />
          <NavLink href="/pm/settings" label="Settings" />
          <NavLink href="/pm/billing" label="Billing" />
        </nav>
      </aside>
      <section className="flex-1 min-w-0">{children}</section>
    </div>
  );
}
