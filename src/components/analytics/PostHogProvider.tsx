"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getPostHog } from "@/lib/posthog";

export function PostHogProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string | null>(null);

  // Ensure singleton init on first mount
  useEffect(() => {
    getPostHog();
  }, []);

  // Manual pageview capture with dedupe
  useEffect(() => {
    const ph = getPostHog();
    if (!ph) return;

    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (!url || lastTrackedRef.current === url) return;

    lastTrackedRef.current = url;
    ph.capture("$pageview", { $current_url: url, path: pathname });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
