"use client";

import type { ReactNode, HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...rest }: CardProps) {
  return (
    <div className={`border-b border-slate-100 px-5 py-3.5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", ...rest }: CardProps) {
  return (
    <div className={`px-5 py-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...rest }: CardProps) {
  return (
    <div className={`border-t border-slate-100 px-5 py-3.5 ${className}`} {...rest}>
      {children}
    </div>
  );
}
