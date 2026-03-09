"use client";

import Link from "next/link";
import type { PMTasksListViewModel } from "@/services/pm/types";
import { Badge } from "@/components/ui/Badge";

interface PMTasksListProps {
  vm: PMTasksListViewModel;
}

export function PMTasksList({ vm }: PMTasksListProps) {
  if (!vm.hasTasks) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Tasks &amp; follow-ups</h2>
      </div>
      <ul className="divide-y divide-slate-800/50 text-sm">
        {vm.tasks.map((task) => (
          <li key={task.id}>
            <Link
              href={task.link}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-900/50 transition-colors"
            >
              <span className="text-slate-200">{task.title}</span>
              <Badge variant={task.severity}>{task.badgeText}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
