"use client";

import type { ReactNode, HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-slate-800 bg-slate-950/70 shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...rest }: CardProps) {
  return (
    <div className={`border-b border-slate-800 px-4 py-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", ...rest }: CardProps) {
  return (
    <div className={`px-4 py-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...rest }: CardProps) {
  return (
    <div className={`border-t border-slate-800 px-4 py-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}
