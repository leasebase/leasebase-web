"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAppConfig } from "@/lib/config";

export default function LogoutPage() {
  const router = useRouter();
  const config = getAppConfig();

  useEffect(() => {
    async function run() {
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch {
        // ignore
      }

      // Optionally also redirect to Cognito logout if configured
      if (config.cognito.domain && config.cognito.clientId) {
        const redirectUri = `${window.location.origin}/`;
        const url = new URL(`https://${config.cognito.domain}/logout`);
        url.searchParams.set("client_id", config.cognito.clientId!);
        url.searchParams.set("logout_uri", redirectUri);
        window.location.href = url.toString();
      } else {
        router.replace("/");
      }
    }
    run();
  }, [router, config]);

  return (
    <div className="max-w-md mx-auto space-y-2">
      <h1 className="text-2xl font-semibold">Signing you out…</h1>
      <p className="text-sm text-slate-300">You will be redirected shortly.</p>
    </div>
  );
}
