"use client";

import Link from "next/link";
import type { PriorityAction } from "@/components/ui/PriorityActions";

/**
 * Figma-matching "Action Required" panel for the dashboard.
 * Shows individual action cards with title, description, and full-width CTA button.
 */
export function ActionPanel({ actions }: { actions: PriorityAction[] }) {
  if (actions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md h-full">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
        <h2 className="text-[14px] font-semibold text-gray-900">Action Required</h2>
        <p className="text-[12px] text-gray-600 mt-0.5">Priority tasks needing attention</p>
      </div>
      <div className="p-3 space-y-2.5">
        {actions.map((item) => {
          const isUrgent = item.severity === "danger";
          return (
            <div
              key={item.id}
              className={`group p-3.5 rounded-lg border transition-all ${
                isUrgent
                  ? "bg-gradient-to-br from-red-50 to-orange-50/50 border-red-200 hover:border-red-300 hover:shadow-md shadow-red-100/30"
                  : "bg-gradient-to-br from-gray-50 to-gray-50/30 border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5 mb-2.5">
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold mb-1 ${isUrgent ? "text-red-900" : "text-gray-900"}`}>
                    {item.title}
                  </p>
                  <p className={`text-[12px] ${isUrgent ? "text-red-700" : "text-gray-600"}`}>
                    {item.description}
                  </p>
                </div>
                {isUrgent && (
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1 animate-pulse shadow-sm shadow-red-500/50" />
                )}
              </div>
              <Link
                href={item.ctaHref}
                className={`block w-full h-8 text-[12px] font-semibold rounded-lg transition-all text-center leading-8 ${
                  isUrgent
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md shadow-red-600/30"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-sm"
                }`}
              >
                {item.ctaLabel}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
