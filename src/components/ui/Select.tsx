"use client";

import { forwardRef, type SelectHTMLAttributes, useId } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, children, className = "", id: externalId, ...rest }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;
    const errorId = `${id}-error`;

    return (
      <div className="space-y-1 text-sm">
        {label && (
          <label htmlFor={id} className="block font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            error ? "border-danger" : "border-slate-300 hover:border-slate-400"
          } disabled:opacity-50 ${className}`}
          {...rest}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} className="text-danger text-xs" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-slate-400 text-xs">{helperText}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
