"use client";

import { useEffect, useState } from "react";
import { toApiError } from "@/lib/api/http";
import {
  getPmDashboard,
  getTenantDashboard,
  listProperties,
  listTenantWorkOrders
} from "@/lib/api/client";
import type { ApiError } from "@/lib/api/http";
import type { PmDashboardSummary, Property, TenantDashboardSummary, WorkOrder } from "@/lib/api/types";

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

function useApiQueryInternal<T>(fn: () => Promise<T>): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fn();
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: toApiError(err) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fn]);

  return state;
}

export function usePmDashboard(): QueryState<PmDashboardSummary> {
  return useApiQueryInternal(getPmDashboard);
}

export function useTenantDashboard(): QueryState<TenantDashboardSummary> {
  return useApiQueryInternal(getTenantDashboard);
}

export function usePmProperties(): QueryState<Property[]> {
  return useApiQueryInternal(listProperties);
}

export function useTenantWorkOrders(): QueryState<WorkOrder[]> {
  return useApiQueryInternal(listTenantWorkOrders);
}
