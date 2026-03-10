"use client";

import { forwardRef, type InputHTMLAttributes, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id: externalId, ...rest }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="space-y-1 text-sm">
        {label && (
          <label htmlFor={id} className="block font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            error
              ? "border-danger focus:ring-danger"
              : "border-slate-300 hover:border-slate-400"
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...rest}
        />
        {error && (
          <p id={errorId} className="text-danger text-xs" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-slate-400 text-xs">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
