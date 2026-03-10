"use client";

import type { ReactNode } from "react";

export type PageContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface PageContainerProps {
  children: ReactNode;
  /** Max-width preset. Defaults to "lg" (1024px). */
  size?: PageContainerSize;
  /** Extra Tailwind classes appended to the container. */
  className?: string;
  /** Remove vertical padding (e.g. when nesting). */
  noPadY?: boolean;
}

const maxWidthClasses: Record<PageContainerSize, string> = {
  sm:   "max-w-2xl",   // 672px
  md:   "max-w-3xl",   // 768px
  lg:   "max-w-5xl",   // 1024px
  xl:   "max-w-7xl",   // 1280px
  full: "max-w-full",
};

/**
 * Standardises page-level width, horizontal padding, and vertical spacing.
 *
 * Usage:
 *   <PageContainer>
 *     <PageHeader … />
 *     <Card>…</Card>
 *   </PageContainer>
 *
 * Spacing tokens used:
 *   - px: sp-lg (24px) on md+, sp-md (16px) on mobile
 *   - py: sp-lg (24px)
 *   - gap between children: sp-lg (24px)
 */
export function PageContainer({
  children,
  size = "lg",
  className = "",
  noPadY = false,
}: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full ${maxWidthClasses[size]} px-sp-md md:px-sp-lg ${
        noPadY ? "" : "py-sp-lg"
      } space-y-sp-lg ${className}`}
    >
      {children}
    </div>
  );
}
