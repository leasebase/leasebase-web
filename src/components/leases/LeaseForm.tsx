"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { fetchProperties, fetchUnitsForProperty } from "@/services/properties/propertyService";
import type { PropertyRow, UnitRow } from "@/services/properties/types";
import type { LeaseRow, CreateLeaseDTO } from "@/services/leases/types";
import { LEASE_TYPES } from "@/services/leases/types";

interface LeaseFormProps {
  /** If provided, the form is in edit mode with initial values. */
  initial?: LeaseRow;
  onSubmit: (data: CreateLeaseDTO) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

interface FormErrors {
  propertyId?: string;
  unitId?: string;
  startDate?: string;
  endDate?: string;
  monthlyRent?: string;
}

function validate(data: {
  propertyId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!data.propertyId) errors.propertyId = "Property is required";
  if (!data.unitId) errors.unitId = "Unit is required";
  if (!data.startDate) errors.startDate = "Start date is required";
  if (!data.endDate) errors.endDate = "End date is required";
  else if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    errors.endDate = "End date must be after start date";
  }
  const rentNum = parseFloat(data.monthlyRent);
  if (!data.monthlyRent || isNaN(rentNum) || rentNum <= 0) {
    errors.monthlyRent = "Monthly rent must be greater than 0";
  }
  return errors;
}

export function LeaseForm({ initial, onSubmit, onCancel, submitLabel }: LeaseFormProps) {
  const [propertyId, setPropertyId] = useState(initial?.property_id ?? "");
  const [unitId, setUnitId] = useState(initial?.unit_id ?? "");
  const [tenantId, setTenantId] = useState(initial?.tenant_id ?? "");
  const [leaseType, setLeaseType] = useState(initial?.lease_type ?? "FIXED_TERM");
  const [startDate, setStartDate] = useState(
    initial?.start_date ? initial.start_date.split("T")[0] : "",
  );
  const [endDate, setEndDate] = useState(
    initial?.end_date ? initial.end_date.split("T")[0] : "",
  );
  const [monthlyRent, setMonthlyRent] = useState(
    initial ? String(initial.monthly_rent / 100) : "",
  );
  const [securityDeposit, setSecurityDeposit] = useState(
    initial?.security_deposit ? String(initial.security_deposit / 100) : "",
  );
  const [leaseTerms, setLeaseTerms] = useState(
    initial?.lease_terms ? JSON.stringify(initial.lease_terms, null, 2) : "",
  );

  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load properties on mount
  useEffect(() => {
    fetchProperties(1, 200)
      .then((res) => setProperties(res.data))
      .catch(() => {})
      .finally(() => setLoadingProperties(false));
  }, []);

  // Load units when propertyId changes
  useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      return;
    }
    setLoadingUnits(true);
    fetchUnitsForProperty(propertyId, 1, 200)
      .then((res) => setUnits(res.data))
      .catch(() => setUnits([]))
      .finally(() => setLoadingUnits(false));
  }, [propertyId]);

  const handlePropertyChange = (newPropertyId: string) => {
    setPropertyId(newPropertyId);
    if (newPropertyId !== propertyId) setUnitId(""); // Reset unit when property changes
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate({ propertyId, unitId, startDate, endDate, monthlyRent });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    let parsedTerms: Record<string, unknown> | undefined;
    if (leaseTerms.trim()) {
      try {
        parsedTerms = JSON.parse(leaseTerms);
      } catch {
        // silently ignore invalid JSON — it's optional
      }
    }

    const dto: CreateLeaseDTO = {
      propertyId,
      unitId,
      tenantId: tenantId || undefined,
      leaseType,
      startDate,
      endDate,
      monthlyRent: Math.round(parseFloat(monthlyRent) * 100),
      securityDeposit: securityDeposit
        ? Math.round(parseFloat(securityDeposit) * 100)
        : undefined,
      leaseTerms: parsedTerms,
    };

    try {
      setSubmitting(true);
      await onSubmit(dto);
    } catch (err: any) {
      setServerError(err?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Property"
          value={propertyId}
          onChange={(e) => handlePropertyChange(e.target.value)}
          error={errors.propertyId}
          required
          disabled={loadingProperties}
        >
          <option value="">
            {loadingProperties ? "Loading…" : "Select property…"}
          </option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Select
          label="Unit"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          error={errors.unitId}
          required
          disabled={!propertyId || loadingUnits}
        >
          <option value="">
            {loadingUnits
              ? "Loading…"
              : !propertyId
                ? "Select a property first"
                : "Select unit…"}
          </option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              Unit {u.unit_number}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Tenant ID"
          placeholder="Optional — tenant user ID"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />

        <Select
          label="Lease Type"
          value={leaseType}
          onChange={(e) => setLeaseType(e.target.value)}
        >
          {LEASE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={errors.startDate}
          required
        />

        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={errors.endDate}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Monthly Rent ($)"
          type="number"
          placeholder="0.00"
          value={monthlyRent}
          onChange={(e) => setMonthlyRent(e.target.value)}
          error={errors.monthlyRent}
          required
        />

        <Input
          label="Security Deposit ($)"
          type="number"
          placeholder="Optional"
          value={securityDeposit}
          onChange={(e) => setSecurityDeposit(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Lease Terms (JSON, optional)
        </label>
        <textarea
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          rows={4}
          placeholder='{"pets": false, "parking": true}'
          value={leaseTerms}
          onChange={(e) => setLeaseTerms(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting
            ? "Saving…"
            : submitLabel ?? (initial ? "Save Changes" : "Create Lease")}
        </Button>
      </div>
    </form>
  );
}
