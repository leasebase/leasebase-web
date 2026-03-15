"use client";

import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PALETTE, TOOLTIP_STYLE } from "./chartTheme";

export interface MiniBarItem {
  label: string;
  value: number;
  color?: string;
}

export interface MiniBarChartProps {
  items: MiniBarItem[];
  height?: number;
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

/**
 * Compact bar chart with no axes — designed for embedding
 * inside dashboard cards alongside numeric stats.
 */
export function MiniBarChart({
  items,
  height = 60,
  showTooltip = true,
}: MiniBarChartProps) {
  const total = items.reduce((s, it) => s + it.value, 0);
  if (total === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={items} barCategoryGap="20%">
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {items.map((it, i) => (
            <Cell key={it.label} fill={it.color ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
        {showTooltip && (
          <Tooltip
            formatter={(value: number, _: string, props: { payload?: MiniBarItem }) => [
              `${value}`,
              props.payload?.label ?? "",
            ]}
            {...TOOLTIP_STYLE}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
