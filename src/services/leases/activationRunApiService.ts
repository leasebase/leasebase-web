/**
 * Activation Run API Service — Phase 2
 *
 * Client for lease-service activation recovery endpoints.
 * Proxied via BFF → lease-service.
 */

import { apiRequest } from "@/lib/api/client";

export type ActivationRunStatus = "PENDING" | "COMPLETED" | "PARTIAL_FAILURE";
export type ActivationStepStatus = "PENDING" | "SUCCESS" | "FAILURE" | "SKIPPED";

export interface ActivationRunStep {
  id: string;
  run_id: string;
  step_name: string;
  status: ActivationStepStatus;
  error_message?: string | null;
  created_at: string;
}

export interface ActivationRun {
  id: string;
  lease_id: string;
  org_id: string;
  status: ActivationRunStatus;
  triggered_by: string;
  created_at: string;
  updated_at: string;
  steps: ActivationRunStep[];
}

export async function fetchActivationRun(
  leaseId: string,
): Promise<{ data: ActivationRun | null }> {
  return apiRequest<{ data: ActivationRun | null }>({
    path: `api/leases/${leaseId}/activation-run`,
  });
}

export async function retryActivationSync(
  leaseId: string,
): Promise<{
  data: ActivationRun;
  retried: boolean;
  status: ActivationRunStatus;
  remainingFailures: string[];
  alreadyCompleted?: boolean;
}> {
  return apiRequest({
    path: `api/leases/${leaseId}/retry-activation-sync`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}
