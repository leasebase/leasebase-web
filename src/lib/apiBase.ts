export function getApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;

  // If we have a configured base URL and we're on the server, just use it.
  if (typeof window === "undefined") {
    return env || "";
  }

  // No env set: default to same origin /api
  if (!env) {
    return `${window.location.origin}/api`;
  }

  try {
    const url = new URL(env, window.location.origin);

    // If the configured URL points at the same origin as the web app but
    // does not include /api, assume the API is served under /api.
    if (url.origin === window.location.origin && !url.pathname.startsWith("/api")) {
      url.pathname = `/api${url.pathname === "/" ? "" : url.pathname}`;
    }

    // Normalise: strip trailing slash
    let out = url.toString();
    if (out.endsWith("/")) {
      out = out.slice(0, -1);
    }
    return out;
  } catch {
    // If env is not a valid URL, fall back to it as-is.
    return env;
  }
}
