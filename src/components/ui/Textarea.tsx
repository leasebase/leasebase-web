"use client";

import { forwardRef, type TextareaHTMLAttributes, useId } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            error
              ? "border-danger focus:ring-danger"
              : "border-slate-200 hover:border-slate-300"
          } disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[5rem] ${className}`}
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

Textarea.displayName = "Textarea";
