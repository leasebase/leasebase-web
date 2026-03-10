"use client";

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  label?: string;
  /** Display the percentage next to the bar */
  showValue?: boolean;
  variant?: "brand" | "success" | "warning" | "danger";
  className?: string;
}

const barColors: Record<string, string> = {
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export function ProgressBar({
  value,
  label,
  showValue = true,
  variant = "brand",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          {label && <span className="text-slate-400">{label}</span>}
          {showValue && <span className="font-medium text-slate-200">{clamped.toFixed(1)}%</span>}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColors[variant] ?? barColors.brand}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
