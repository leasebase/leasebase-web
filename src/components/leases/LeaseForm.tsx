"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { fetchProperties, fetchUnitsForProperty } from "@/services/properties/propertyService";
import type { PropertyRow, UnitRow } from "@/services/properties/types";
import type { LeaseRow, CreateLeaseDTO } from "@/services/leases/types";
import { TERM_TYPES, TERM_TYPE_LABELS } from "@/services/leases/types";

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
  termType?: string;
  startDate?: string;
  endDate?: string;
  rentAmount?: string;
}

function validate(data: {
  propertyId: string;
  unitId: string;
  termType: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
}): FormErrors {
  const errors: FormErrors = {};
  if (!data.propertyId) errors.propertyId = "Property is required";
  if (!data.unitId) errors.unitId = "Unit is required";
  if (!data.termType) errors.termType = "Term type is required";
  if (!data.startDate) errors.startDate = "Start date is required";
  if (data.rentAmount < 0) errors.rentAmount = "Must be 0 or more";
  if (data.termType === "CUSTOM") {
    if (!data.endDate) errors.endDate = "End date is required for custom terms";
    else if (data.startDate && data.endDate <= data.startDate) {
      errors.endDate = "End date must be after start date";
    }
  }
  return errors;
}

export function LeaseForm({ initial, onSubmit, onCancel, submitLabel }: LeaseFormProps) {
  const [propertyId, setPropertyId] = useState(initial?.property_id ?? "");
  const [unitId, setUnitId] = useState(initial?.unit_id ?? "");
  const [termType, setTermType] = useState(initial?.term_type ?? "TWELVE_MONTH");
  const [startDate, setStartDate] = useState(
    initial?.start_date ? initial.start_date.split("T")[0] : "",
  );
  const [endDate, setEndDate] = useState(
    initial?.end_date ? initial.end_date.split("T")[0] : "",
  );
  // Convert cents to dollars for display
  const [rentDollars, setRentDollars] = useState(
    initial ? (initial.rent_amount / 100).toString() : "",
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
    if (newPropertyId !== propertyId) setUnitId("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const rentAmountCents = Math.round((Number(rentDollars) || 0) * 100);
    const validationErrors = validate({ propertyId, unitId, termType, startDate, endDate, rentAmount: rentAmountCents });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const dto: CreateLeaseDTO = {
      propertyId,
      unitId,
      termType,
      startDate,
      endDate: termType === "CUSTOM" ? endDate : undefined,
      rentAmount: rentAmountCents, // dollars → cents
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
        <Select
          label="Term"
          value={termType}
          onChange={(e) => setTermType(e.target.value)}
          error={errors.termType}
          required
        >
          {TERM_TYPES.map((t) => (
            <option key={t} value={t}>
              {TERM_TYPE_LABELS[t] ?? t}
            </option>
          ))}
        </Select>

        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={errors.startDate}
          required
        />
      </div>

      {termType === "CUSTOM" && (
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={errors.endDate}
          required
        />
      )}

      <Input
        label="Monthly Rent ($)"
        type="number"
        min={0}
        step={0.01}
        placeholder="0.00"
        value={rentDollars}
        onChange={(e) => setRentDollars(e.target.value)}
        error={errors.rentAmount}
        required
      />

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
