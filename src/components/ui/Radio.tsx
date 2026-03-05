"use client";

import { useId, type InputHTMLAttributes } from "react";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  className = "",
  orientation = "vertical",
}: RadioGroupProps) {
  const groupId = useId();

  return (
    <fieldset className={`space-y-1 text-sm ${className}`}>
      {label && (
        <legend className="block font-medium text-slate-200 mb-1.5">
          {label}
        </legend>
      )}
      <div
        className={`flex gap-3 ${
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
        }`}
        role="radiogroup"
      >
        {options.map((opt) => (
          <RadioItem
            key={opt.value}
            name={name}
            groupId={groupId}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
            disabled={opt.disabled}
            label={opt.label}
          />
        ))}
      </div>
      {error && (
        <p className="text-danger text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/* ── Single Radio ── */
interface RadioItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  groupId: string;
}

function RadioItem({ label, groupId, className = "", ...rest }: RadioItemProps) {
  const id = `${groupId}-${rest.name}-${rest.value ?? label}`;

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 cursor-pointer ${
        rest.disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <input
        type="radio"
        id={id}
        className="h-4 w-4 border-slate-600 bg-slate-900 text-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-0"
        {...rest}
      />
      <span className="text-slate-200">{label}</span>
    </label>
  );
}
