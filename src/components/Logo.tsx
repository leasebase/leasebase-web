export type LogoVariant = "full" | "mark" | "icon" | "micro";
export type LogoTheme = "light" | "dark";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: number;
  className?: string;
}

/** Inline SVG building icon matching the UIUX design system. */
function LogoMark({ size }: { size: number }) {
  return (
    <div
      className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-600/30 ring-1 ring-green-600/20"
      style={{ width: size, height: size }}
    >
      <svg
        className="text-white"
        style={{ width: size * 0.56, height: size * 0.56 }}
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M13 4L22 11L13 13L4 11L13 4Z" fill="white" fillOpacity="0.95" />
        <path d="M13 13L22 11V19L13 22V13Z" fill="white" fillOpacity="0.5" />
        <path d="M13 13L4 11V19L13 22V13Z" fill="white" fillOpacity="0.7" />
        <rect x="10" y="17" width="6" height="5" fill="#22C55E" fillOpacity="0.8" />
      </svg>
    </div>
  );
}

function defaultSize(variant: LogoVariant): number {
  if (variant === "full") return 176;
  if (variant === "micro") return 16;
  return 32;
}

export function Logo({
  variant = "full",
  theme = "light",
  size,
  className = "",
}: LogoProps) {
  const resolvedSize = size ?? defaultSize(variant);
  const isDark = theme === "dark";

  // Mark / icon / micro — just the icon, no text
  if (variant !== "full") {
    return (
      <span className={`lb-logo lb-logo-mark ${className}`.trim()}>
        <LogoMark size={resolvedSize} />
      </span>
    );
  }

  // Full — icon + wordmark text
  // Scale icon to ~22% of the full width, matching UIUX proportions
  const iconSize = Math.round(resolvedSize * 0.2);

  return (
    <span className={`lb-logo inline-flex items-center gap-2.5 ${className}`.trim()}>
      <LogoMark size={iconSize} />
      <span>
        <span
          className={`font-semibold tracking-tight leading-none block ${
            isDark ? "text-white" : "text-slate-900"
          }`}
          style={{ fontSize: resolvedSize * 0.09 }}
        >
          LeaseBase
        </span>
        <span
          className={`tracking-wide uppercase leading-tight block mt-0.5 ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
          style={{ fontSize: resolvedSize * 0.055 }}
        >
          Property OS
        </span>
      </span>
    </span>
  );
}
