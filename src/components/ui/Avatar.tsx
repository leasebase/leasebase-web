"use client";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-14 w-14 text-lg",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ src, alt, name, size = "md", className = "" }: AvatarProps) {
  const sizeClass = sizeMap[size];
  const initials = name ? getInitials(name) : "?";
  const label = alt || name || "User avatar";

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`inline-block rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-brand-600 font-semibold text-white ${sizeClass} ${className}`}
      role="img"
      aria-label={label}
    >
      {initials}
    </span>
  );
}
