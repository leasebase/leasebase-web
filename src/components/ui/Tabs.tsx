"use client";

import {
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  activeId?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

export function Tabs({
  items,
  defaultActiveId,
  activeId: controlledActiveId,
  onTabChange,
  className = "",
}: TabsProps) {
  const [internalActiveId, setInternalActiveId] = useState(
    defaultActiveId || items[0]?.id,
  );
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeId = controlledActiveId ?? internalActiveId;

  const setActive = useCallback(
    (id: string) => {
      if (controlledActiveId === undefined) setInternalActiveId(id);
      onTabChange?.(id);
    },
    [controlledActiveId, onTabChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const enabledItems = items.filter((i) => !i.disabled);
      const currentIdx = enabledItems.findIndex((i) => i.id === activeId);
      let nextIdx = currentIdx;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIdx = (currentIdx + 1) % enabledItems.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIdx = (currentIdx - 1 + enabledItems.length) % enabledItems.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIdx = enabledItems.length - 1;
      } else {
        return;
      }

      const next = enabledItems[nextIdx];
      setActive(next.id);
      tabRefs.current.get(next.id)?.focus();
    },
    [items, activeId, setActive],
  );

  const activeItem = items.find((i) => i.id === activeId);

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex border-b border-slate-800"
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) tabRefs.current.set(item.id, el);
              }}
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => setActive(item.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isActive
                  ? "border-b-2 border-brand-500 text-brand-300"
                  : "text-slate-400 hover:text-slate-200"
              } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activeItem && (
        <div
          role="tabpanel"
          id={`tabpanel-${activeItem.id}`}
          aria-labelledby={`tab-${activeItem.id}`}
          tabIndex={0}
          className="py-4"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
