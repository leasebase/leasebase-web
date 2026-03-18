/**
 * PostHog singleton — initialised once in the browser.
 *
 * Requires NEXT_PUBLIC_POSTHOG_KEY to be set.
 * If missing, all PostHog calls silently no-op.
 */

import posthog from "posthog-js";

let _initialized = false;

export function getPostHog(): typeof posthog | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!_initialized) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false, // we fire manually on route change
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });
    _initialized = true;
  }

  return posthog;
}
