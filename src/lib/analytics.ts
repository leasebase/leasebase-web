/**
 * Lightweight analytics — funnel event tracking.
 *
 * Every call logs to the console (visible in DevTools) and dispatches a
 * `lb:analytics` CustomEvent on `window` so external scripts (GTM, Segment,
 * PostHog, etc.) can subscribe without coupling the app to a specific vendor.
 *
 * Usage:
 *   import { track } from "@/lib/analytics";
 *   track("signup_started");
 *   track("landing_cta_clicked", { location: "hero" });
 */

export function track(event: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[analytics]", event, data);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("lb:analytics", { detail: { event, data, ts: Date.now() } }),
    );
  }
}
