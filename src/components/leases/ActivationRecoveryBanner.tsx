"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  fetchActivationRun,
  retryActivationSync,
  type ActivationRun,
} from "@/services/leases/activationRunApiService";

interface Props {
  leaseId: string;
  leaseStatus: string;
}

export function ActivationRecoveryBanner({ leaseId, leaseStatus }: Props) {
  const [run, setRun] = useState<ActivationRun | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (leaseStatus !== "ACTIVE") return;
    try {
      const { data } = await fetchActivationRun(leaseId);
      setRun(data);
    } catch {
      // Silently ignore — banner is non-critical
    }
  }, [leaseId, leaseStatus]);

  useEffect(() => { load(); }, [load]);

  if (!run || run.status !== "PARTIAL_FAILURE") return null;

  const failedSteps = run.steps.filter((s) => s.status === "FAILURE");

  async function handleRetry() {
    setRetrying(true);
    setRetryResult(null);
    try {
      const result = await retryActivationSync(leaseId);
      if (result.status === "COMPLETED") {
        setRetryResult("All sync steps completed successfully.");
        setRun(null);
      } else {
        setRetryResult(`Retry completed with remaining failures: ${result.remainingFailures.join(", ")}`);
        await load();
      }
    } catch (e: any) {
      setRetryResult(`Retry failed: ${e?.message}`);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="rounded-lg border border-amber-700/60 bg-amber-950/30 px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-medium text-amber-200">
            Activation partially failed
          </p>
          <p className="text-xs text-amber-400/80">
            The lease was activated but these sync steps failed:{" "}
            {failedSteps.map((s) => s.step_name).join(", ")}.
          </p>
          {failedSteps.some((s) => s.error_message) && (
            <details className="text-xs text-amber-600">
              <summary className="cursor-pointer select-none">Show error details</summary>
              <ul className="mt-1 space-y-0.5 pl-3">
                {failedSteps.filter((s) => s.error_message).map((s) => (
                  <li key={s.id}><span className="font-medium">{s.step_name}:</span> {s.error_message}</li>
                ))}
              </ul>
            </details>
          )}
          {retryResult && (
            <p className="text-xs text-amber-300">{retryResult}</p>
          )}
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded border border-amber-700 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-900/40 disabled:opacity-50"
        >
          <RefreshCw size={11} className={retrying ? "animate-spin" : ""} />
          {retrying ? "Retrying…" : "Retry sync"}
        </button>
      </div>
    </div>
  );
}
