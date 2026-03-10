"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  Wrench,
  Search,
  type LucideIcon,
} from "lucide-react";

/* ── Types ── */
export interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Category shown as a group header. */
  group: string;
  /** Action to perform — a path to navigate to, or a callback. */
  action: string | (() => void);
  /** Search keywords beyond the label. */
  keywords?: string[];
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Extra commands beyond the built-in set. */
  extraCommands?: CommandItem[];
}

/* ── Built-in commands ── */
const builtInCommands: CommandItem[] = [
  { id: "add-property",    label: "Add Property",             icon: Building2,  group: "Create",  action: "/app/properties",        keywords: ["new", "building"] },
  { id: "add-tenant",      label: "Add Tenant",               icon: Users,      group: "Create",  action: "/app/tenants",           keywords: ["invite", "resident"] },
  { id: "create-lease",    label: "Create Lease",             icon: FileText,   group: "Create",  action: "/app/leases/new",        keywords: ["agreement", "contract"] },
  { id: "record-payment",  label: "Record Payment",           icon: CreditCard, group: "Create",  action: "/app/payments",          keywords: ["rent", "charge"] },
  { id: "new-maintenance",  label: "New Maintenance Request", icon: Wrench,     group: "Create",  action: "/app/maintenance/new",   keywords: ["work order", "repair", "fix"] },
  { id: "search-tenants",  label: "Search Tenants",           icon: Search,     group: "Search",  action: "/app/tenants",           keywords: ["find", "resident"] },
  { id: "search-properties",label: "Search Properties",       icon: Search,     group: "Search",  action: "/app/properties",        keywords: ["find", "building"] },
];

/* ── Component ── */
export function CommandPalette({ open, onClose, extraCommands = [] }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const allCommands = useMemo(
    () => [...builtInCommands, ...extraCommands],
    [extraCommands],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.group.toLowerCase().includes(q) ||
        cmd.keywords?.some((k) => k.toLowerCase().includes(q)),
    );
  }, [query, allCommands]);

  // Group the filtered commands
  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const cmd of filtered) {
      const list = map.get(cmd.group) || [];
      list.push(cmd);
      map.set(cmd.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Clamp active index
  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIndex]);

  const execute = useCallback(
    (cmd: CommandItem) => {
      onClose();
      if (typeof cmd.action === "string") {
        router.push(cmd.action);
      } else {
        cmd.action();
      }
    },
    [onClose, router],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIndex]) execute(filtered[activeIndex]);
      }
    },
    [onClose, filtered, activeIndex, execute],
  );

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector("[data-active='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  let flatIdx = -1;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
      role="presentation"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-modal overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
          <Search size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
            placeholder="Type a command or search…"
            aria-label="Command search"
            autoComplete="off"
          />
          <kbd className="hidden sm:inline-block rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
            Esc
          </kbd>
        </div>

        {/* Command list */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-2" role="listbox">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No commands found.
            </p>
          ) : (
            groups.map(([groupLabel, items]) => (
              <div key={groupLabel}>
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {groupLabel}
                </p>
                {items.map((cmd) => {
                  flatIdx++;
                  const isActive = flatIdx === activeIndex;
                  const idx = flatIdx; // capture for onClick
                  const IconCmp = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-brand-500/10 text-brand-300"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <IconCmp size={16} className="shrink-0" />
                      <span>{cmd.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500">
          <span><kbd className="rounded border border-slate-700 px-1">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-slate-700 px-1">↵</kbd> select</span>
          <span><kbd className="rounded border border-slate-700 px-1">esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
