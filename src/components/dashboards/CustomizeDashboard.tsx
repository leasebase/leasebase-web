"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import type { ResolvedWidget } from "@/lib/dashboard/widgetRegistry";
import { toPreferences } from "@/lib/dashboard/widgetRegistry";
import { savePreferences, resetPreferences } from "@/lib/dashboard/preferences";

interface CustomizeDashboardProps {
  open: boolean;
  onClose: () => void;
  role: "owner" | "tenant";
  widgets: ResolvedWidget[];
  onSave: (updated: ResolvedWidget[]) => void;
}

export function CustomizeDashboard({
  open,
  onClose,
  role,
  widgets,
  onSave,
}: CustomizeDashboardProps) {
  const [local, setLocal] = useState<ResolvedWidget[]>(() => [...widgets]);

  // Sync local state from props every time the modal opens so we never show stale data.
  useEffect(() => {
    if (open) {
      setLocal([...widgets]);
    }
  }, [open, widgets]);

  // Toggle enabled/disabled
  const toggle = (id: string) => {
    setLocal((prev) =>
      prev.map((w) =>
        w.definition.id === id ? { ...w, enabled: !w.enabled } : w,
      ),
    );
  };

  // Move widget up
  const moveUp = (index: number) => {
    if (index <= 0) return;
    setLocal((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((w, i) => ({ ...w, position: i }));
    });
  };

  // Move widget down
  const moveDown = (index: number) => {
    setLocal((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((w, i) => ({ ...w, position: i }));
    });
  };

  // Reset to defaults
  const handleReset = () => {
    resetPreferences(role);
    // Rebuild from definitions with default positions
    const defaults = widgets
      .map((w) => ({
        ...w,
        enabled: w.definition.defaultEnabled,
        position: w.definition.defaultPosition,
        size: w.definition.defaultSize,
      }))
      .sort((a, b) => a.position - b.position);
    setLocal(defaults);
  };

  // Save
  const handleSave = () => {
    const prefs = toPreferences(local);
    savePreferences(role, prefs);
    onSave(local);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize Dashboard"
      className="max-w-md"
    >
      <div className="space-y-1 max-h-[60vh] overflow-y-auto -mx-1 px-1">
        {local.map((widget, index) => (
          <div
            key={widget.definition.id}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
              widget.enabled
                ? "border-slate-200 bg-white"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label={`Move ${widget.definition.title} up`}
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === local.length - 1}
                className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label={`Move ${widget.definition.title} down`}
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Widget info */}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${widget.enabled ? "text-slate-900" : "text-slate-400"}`}>
                {widget.definition.title}
              </p>
              <p className="text-xs text-slate-400 capitalize">{widget.definition.type}</p>
            </div>

            {/* Toggle */}
            <Switch
              checked={widget.enabled}
              onChange={() => toggle(widget.definition.id)}
              aria-label={`Toggle ${widget.definition.title}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          icon={<RotateCcw size={14} />}
        >
          Reset to defaults
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
