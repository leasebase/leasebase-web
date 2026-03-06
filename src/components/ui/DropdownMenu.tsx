"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
  className = "",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  // Focus first item when opened
  useEffect(() => {
    if (open) {
      const first = menuRef.current?.querySelector<HTMLButtonElement>(
        'button:not([disabled])',
      );
      first?.focus();
    }
  }, [open]);

  const handleMenuKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const focusable = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>(
          'button:not([disabled])',
        ) ?? [],
      );
      const idx = focusable.indexOf(document.activeElement as HTMLButtonElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusable[(idx + 1) % focusable.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusable[(idx - 1 + focusable.length) % focusable.length]?.focus();
      }
    },
    [],
  );

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={`absolute z-50 mt-1 min-w-[10rem] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onClick?.();
                close();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors focus:outline-none focus:bg-slate-800 ${
                item.danger
                  ? "text-danger hover:bg-danger/10"
                  : "text-slate-200 hover:bg-slate-800"
              } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {item.icon && (
                <span className="shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
