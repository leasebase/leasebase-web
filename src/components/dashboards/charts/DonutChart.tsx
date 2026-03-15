"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PALETTE, TOOLTIP_STYLE } from "./chartTheme";

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** Text rendered in the center hole */
  centerLabel?: string;
  /** Sub-text below center label */
  centerSub?: string;
  height?: number;
  /** Inner/outer radius ratio — default donut style */
  innerRadius?: number;
  outerRadius?: number;
}

export function DonutChart({
  segments,
  centerLabel,
  centerSub,
  height = 180,
  innerRadius = 50,
  outerRadius = 75,
}: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        No data
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            strokeWidth={0}
          >
            {segments.map((seg, i) => (
              <Cell key={seg.label} fill={seg.color ?? PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}`, name]}
            {...TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label overlay */}
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-900">{centerLabel}</span>
          {centerSub && <span className="text-xs text-slate-500">{centerSub}</span>}
        </div>
      )}
    </div>
  );
}
