"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PALETTE, TOOLTIP_STYLE, CHART_COLORS } from "./chartTheme";

export interface BarDefinition {
  dataKey: string;
  label: string;
  color?: string;
  stackId?: string;
}

export interface DashboardBarChartProps {
  /** Array of data objects — each key matches a BarDefinition.dataKey */
  data: Record<string, unknown>[];
  bars: BarDefinition[];
  /** Key in data objects used for the X axis labels */
  xAxisKey: string;
  height?: number;
  /** Show the Y axis */
  showYAxis?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Horizontal orientation (bars go left→right) */
  layout?: "horizontal" | "vertical";
}

export function DashboardBarChart({
  data,
  bars,
  xAxisKey,
  height = 200,
  showYAxis = true,
  showGrid = true,
  showLegend = false,
  layout = "vertical",
}: DashboardBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout === "horizontal" ? "vertical" : "horizontal"}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.slate200} />
        )}
        {layout === "horizontal" ? (
          <>
            <YAxis dataKey={xAxisKey} type="category" tick={{ fontSize: 12, fill: CHART_COLORS.slate500 }} width={80} />
            <XAxis type="number" tick={{ fontSize: 12, fill: CHART_COLORS.slate500 }} />
          </>
        ) : (
          <>
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: CHART_COLORS.slate500 }} />
            {showYAxis && <YAxis tick={{ fontSize: 12, fill: CHART_COLORS.slate500 }} />}
          </>
        )}
        <Tooltip {...TOOLTIP_STYLE} />
        {showLegend && <Legend wrapperStyle={{ fontSize: "0.75rem" }} />}
        {bars.map((bar, i) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.label}
            fill={bar.color ?? PALETTE[i % PALETTE.length]}
            stackId={bar.stackId}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
