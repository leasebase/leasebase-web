"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DISMISS_KEY = "lb-calendly-cta-dismissed";

interface CalendlyCtaProps {
  /** Heading text override. */
  title?: string;
  /** Description override. */
  description?: string;
  className?: string;
}

/**
 * Calendly CTA — shows a dismissible banner linking to the scheduling page.
 *
 * Requires `NEXT_PUBLIC_CALENDLY_URL` to be set.
 * Uses localStorage to persist dismissal.
 */
export function CalendlyCta({
  title = "Schedule your onboarding call",
  description = "Book a free 15-minute call with our team to get the most out of LeaseBase.",
  className = "",
}: CalendlyCtaProps) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  useEffect(() => {
    if (!calendlyUrl) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "true") return;
    } catch {}
    setDismissed(false);
  }, [calendlyUrl]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {}
  }, []);

  if (dismissed || !calendlyUrl) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 ${className}`}
    >
      <Calendar size={20} className="mt-0.5 shrink-0 text-brand-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-brand-800">{title}</p>
        <p className="mt-0.5 text-xs text-brand-600/80">{description}</p>
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block"
        >
          <Button variant="primary" size="sm">
            Book a call
          </Button>
        </a>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="rounded p-1 text-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
