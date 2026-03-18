"use client";

import { forwardRef, type InputHTMLAttributes, useId } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", id: externalId, ...rest }, ref) => {
    const autoId = useId();
    const id = externalId || autoId;

    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={`h-4 w-4 rounded border-slate-300 bg-white text-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 ${className}`}
          {...rest}
        />
        {label && (
          <label htmlFor={id} className="text-sm text-slate-700 select-none">
            {label}
          </label>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
