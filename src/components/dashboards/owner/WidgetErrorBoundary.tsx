"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  /** Human-readable widget name shown in the fallback. */
  name: string;
  children: ReactNode;
  /** Use dark variant for tenant dashboard. */
  variant?: "light" | "dark";
}

interface State {
  hasError: boolean;
}

/**
 * Catches render/runtime errors within a single dashboard widget.
 *
 * NOTE: This does NOT handle async fetch failures — those are captured in the
 * service layer's DomainResult and surfaced via the data/state layer.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[WidgetErrorBoundary] ${this.props.name}:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      const dark = this.props.variant === "dark";
      return (
        <div
          className={`flex items-center gap-2 rounded-lg border p-4 text-sm ${
            dark
              ? "border-slate-700 bg-slate-900 text-slate-400"
              : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          <AlertTriangle size={16} className="shrink-0 text-amber-400" />
          <span>{this.props.name} failed to render.</span>
        </div>
      );
    }
    return this.props.children;
  }
}
