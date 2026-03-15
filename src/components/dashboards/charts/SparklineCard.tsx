"use client";

import type { ReactNode } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./chartTheme";

export interface SparklineCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: ReactNode;
  /** Array of numeric values rendered as a sparkline area */
  trend: number[];
  /** Sparkline color — defaults to brand */
  color?: string;
}

/**
 * Enhanced stat card that renders a small area sparkline below
 * the headline metric, providing at-a-glance trend context.
 */
export function SparklineCard({
  label,
  value,
  change,
  icon,
  trend,
  color = CHART_COLORS.brand,
}: SparklineCardProps) {
  const data = trend.map((v, i) => ({ i, v }));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {change && <p className="mt-0.5 text-xs text-slate-500">{change}</p>}
        </div>
        {icon && (
          <span className="rounded-md bg-brand-50 p-2 text-brand-600" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      {data.length > 1 && (
        <div className="mt-2 -mx-1">
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#spark-${label})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
