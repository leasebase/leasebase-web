/**
 * Lightweight analytics — funnel event tracking.
 *
 * Every call logs to the console (visible in DevTools), dispatches a
 * `lb:analytics` CustomEvent on `window`, and forwards to PostHog
 * if initialised.
 *
 * Usage:
 *   import { track, identify, resetAnalytics } from "@/lib/analytics";
 *   track("signup_started");
 *   identify("user-id", { email: "a@b.com", role: "OWNER" });
 */

import { getPostHog } from "@/lib/posthog";

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

  // Forward to PostHog when available
  const ph = getPostHog();
  if (ph) ph.capture(event, data);
}

/**
 * Identify the current user in PostHog after login/signup.
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  const ph = getPostHog();
  if (ph) ph.identify(userId, traits);
}

/**
 * Reset PostHog identity on logout.
 */
export function resetAnalytics(): void {
  const ph = getPostHog();
  if (ph) ph.reset();
}
