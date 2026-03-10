/**
 * Owner Portfolio — Property Service
 *
 * API client for property and unit CRUD operations.
 * Uses /api/properties endpoints (not /api/pm) — these endpoints
 * scope data by organization_id from the JWT. No client-side
 * scope hints are sent.
 *
 * GUARDRAILS:
 * - Never passes org_id, property_id as authorization hints
 * - Server resolves all scoping via JWT
 * - All write operations return the created/updated row
 */

import { apiRequest } from "@/lib/api/client";
import type {
  PropertyRow,
  UnitRow,
  PaginatedResponse,
  CreatePropertyDTO,
  UpdatePropertyDTO,
  CreateUnitDTO,
  UpdateUnitDTO,
} from "./types";

/* ─── Properties ─── */

export async function fetchProperties(
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<PropertyRow>> {
  return apiRequest<PaginatedResponse<PropertyRow>>({
    path: `api/properties?page=${page}&limit=${limit}`,
  });
}

export async function fetchProperty(
  id: string,
): Promise<{ data: PropertyRow }> {
  return apiRequest<{ data: PropertyRow }>({
    path: `api/properties/${id}`,
  });
}

export async function createProperty(
  dto: CreatePropertyDTO,
): Promise<{ data: PropertyRow }> {
  return apiRequest<{ data: PropertyRow }>({
    path: "api/properties",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function updateProperty(
  id: string,
  dto: UpdatePropertyDTO,
): Promise<{ data: PropertyRow }> {
  return apiRequest<{ data: PropertyRow }>({
    path: `api/properties/${id}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

/* ─── Units ─── */

export async function fetchUnitsForProperty(
  propertyId: string,
  page = 1,
  limit = 100,
): Promise<PaginatedResponse<UnitRow>> {
  return apiRequest<PaginatedResponse<UnitRow>>({
    path: `api/properties/${propertyId}/units?page=${page}&limit=${limit}`,
  });
}

export async function fetchUnit(
  unitId: string,
): Promise<{ data: UnitRow }> {
  return apiRequest<{ data: UnitRow }>({
    path: `api/properties/units/${unitId}`,
  });
}

export async function createUnit(
  propertyId: string,
  dto: CreateUnitDTO,
): Promise<{ data: UnitRow }> {
  return apiRequest<{ data: UnitRow }>({
    path: `api/properties/${propertyId}/units`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function updateUnit(
  unitId: string,
  dto: UpdateUnitDTO,
): Promise<{ data: UnitRow }> {
  return apiRequest<{ data: UnitRow }>({
    path: `api/properties/units/${unitId}`,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

/* ─── Aggregation helper ─── */

/**
 * Fetch all properties with unit counts.
 * Fetches properties first, then fans out to get unit counts per property.
 * Uses concurrency cap to avoid overwhelming the backend.
 */
export async function fetchPropertiesWithUnitCounts(
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<PropertyRow> & { unitCounts: Record<string, { total: number; occupied: number }> }> {
  const propertiesRes = await fetchProperties(page, limit);

  const CONCURRENCY = 6;
  const unitCounts: Record<string, { total: number; occupied: number }> = {};

  for (let i = 0; i < propertiesRes.data.length; i += CONCURRENCY) {
    const batch = propertiesRes.data.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((p) => fetchUnitsForProperty(p.id, 1, 100)),
    );

    results.forEach((result, idx) => {
      const propertyId = batch[idx].id;
      if (result.status === "fulfilled") {
        const units = result.value.data;
        unitCounts[propertyId] = {
          total: result.value.meta.total,
          occupied: units.filter((u) => u.status === "OCCUPIED").length,
        };
      } else {
        unitCounts[propertyId] = { total: 0, occupied: 0 };
      }
    });
  }

  return { ...propertiesRes, unitCounts };
}
