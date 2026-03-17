import type { CSSProperties } from "react";

export type LogoVariant = "full" | "mark" | "icon" | "micro";
export type LogoTheme = "light" | "dark";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: number;
  className?: string;
}

const FULL_ASPECT = 220 / 760;

function resolveLogoSrc(variant: LogoVariant, theme: LogoTheme): string {
  if (variant === "full") {
    return theme === "dark"
      ? "/assets/brand/leasebase-logo-white.svg"
      : "/assets/brand/leasebase-logo-full.svg";
  }
  if (variant === "mark") return "/assets/brand/leasebase-logo-mark.svg";
  if (variant === "micro") return "/assets/brand/leasebase-logo-micro.svg";
  return "/assets/brand/leasebase-logo-icon.svg";
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
  const src = resolveLogoSrc(variant, theme);
  const isFull = variant === "full";
  const width = resolvedSize;
  const height = isFull ? Math.round(resolvedSize * FULL_ASPECT) : resolvedSize;
  const style: CSSProperties = isFull
    ? { width: resolvedSize, height: "auto" }
    : { width: resolvedSize, height: resolvedSize };

  return (
    <span className={`lb-logo ${!isFull ? "lb-logo-mark" : ""} ${className}`.trim()}>
      <img
        src={src}
        alt={isFull ? "LeaseBase" : "LeaseBase mark"}
        width={width}
        height={height}
        style={style}
      />
    </span>
  );
}
