/**
 * OAuth helpers — Google sign-in redirect.
 *
 * The frontend redirects to the backend-initiated OAuth URL. The backend
 * handles the Cognito Hosted UI flow, exchanges the code for tokens, and
 * redirects back to `/auth/callback` with tokens in query params.
 */

import { getApiBaseUrl } from "@/lib/apiBase";
import { track } from "@/lib/analytics";

/**
 * Build the Google OAuth redirect URL.
 *
 * @param returnUrl – Where to redirect after successful auth (encoded into
 *                    `state` so the callback page can pick it up).
 */
export function buildGoogleAuthUrl(returnUrl = "/app"): string {
  const base = getApiBaseUrl();
  const state = encodeURIComponent(returnUrl);
  return `${base}/api/auth/oauth/google?state=${state}`;
}

/**
 * Kick off Google OAuth by navigating to the backend-initiated URL.
 *
 * Fires analytics events before redirecting.
 */
export function startGoogleAuth(returnUrl = "/app"): void {
  track("signup_method_selected", { method: "google" });
  track("oauth_redirect_started", { provider: "google" });

  const url = buildGoogleAuthUrl(returnUrl);
  window.location.href = url;
}
