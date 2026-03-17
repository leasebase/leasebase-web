import type { CSSProperties } from "react";

export type LogoVariant = "full" | "mark" | "icon";
export type LogoTheme = "light" | "dark";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: number;
  className?: string;
}

function resolveLogoSrc(variant: LogoVariant, theme: LogoTheme): string {
  if (variant === "full") {
    return theme === "dark"
      ? "/assets/brand/leasebase-logo-white.svg"
      : "/assets/brand/leasebase-logo-full.svg";
  }
  if (variant === "mark") return "/assets/brand/leasebase-logo-mark.svg";
  return "/assets/brand/leasebase-logo-icon.svg";
}

export function Logo({
  variant = "full",
  theme = "light",
  size,
  className = "",
}: LogoProps) {
  const resolvedSize = size ?? (variant === "full" ? 176 : 32);
  const src = resolveLogoSrc(variant, theme);
  const fullHeight = Math.round((resolvedSize * 220) / 760);
  const width = variant === "full" ? resolvedSize : resolvedSize;
  const height = variant === "full" ? fullHeight : resolvedSize;
  const style: CSSProperties = variant === "full"
    ? { width: resolvedSize, height: "auto" }
    : { width: resolvedSize, height: resolvedSize };

  return (
    <span className={`lb-logo ${variant !== "full" ? "lb-logo-mark" : ""} ${className}`.trim()}>
      <img
        src={src}
        alt={variant === "full" ? "LeaseBase" : "LeaseBase mark"}
        width={width}
        height={height}
        style={style}
      />
    </span>
  );
}
