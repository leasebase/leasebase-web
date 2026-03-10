"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { CreateUnitDTO, UnitRow, UNIT_STATUSES } from "@/services/properties/types";

interface UnitFormProps {
  initial?: UnitRow;
  onSubmit: (data: CreateUnitDTO) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

interface FormErrors {
  unitNumber?: string;
  bedrooms?: string;
  bathrooms?: string;
  rentAmount?: string;
  squareFeet?: string;
}

function validate(data: CreateUnitDTO): FormErrors {
  const errors: FormErrors = {};
  if (!data.unitNumber.trim()) errors.unitNumber = "Unit number is required";
  if (data.bedrooms < 0) errors.bedrooms = "Must be 0 or more";
  if (data.bathrooms < 0) errors.bathrooms = "Must be 0 or more";
  if (data.rentAmount < 0) errors.rentAmount = "Must be 0 or more";
  if (data.squareFeet != null && data.squareFeet < 0) errors.squareFeet = "Must be 0 or more";
  return errors;
}

export function UnitForm({ initial, onSubmit, onCancel, submitLabel }: UnitFormProps) {
  const [unitNumber, setUnitNumber] = useState(initial?.unit_number ?? "");
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms?.toString() ?? "0");
  const [bathrooms, setBathrooms] = useState(initial?.bathrooms?.toString() ?? "1");
  const [squareFeet, setSquareFeet] = useState(initial?.square_feet?.toString() ?? "");
  // Convert cents to dollars for display
  const [rentDollars, setRentDollars] = useState(
    initial ? (initial.rent_amount / 100).toString() : "",
  );
  const [status, setStatus] = useState(initial?.status ?? "AVAILABLE");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const dto: CreateUnitDTO = {
      unitNumber: unitNumber.trim(),
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      squareFeet: squareFeet.trim() ? Number(squareFeet) : undefined,
      rentAmount: Math.round((Number(rentDollars) || 0) * 100), // dollars → cents
      status,
    };

    const validationErrors = validate(dto);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}

      <Input
        label="Unit Number / Name"
        placeholder="e.g. 101, A, Penthouse"
        value={unitNumber}
        onChange={(e) => setUnitNumber(e.target.value)}
        error={errors.unitNumber}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Bedrooms"
          type="number"
          min={0}
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          error={errors.bedrooms}
        />
        <Input
          label="Bathrooms"
          type="number"
          min={0}
          step={0.5}
          value={bathrooms}
          onChange={(e) => setBathrooms(e.target.value)}
          error={errors.bathrooms}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Square Feet"
          type="number"
          min={0}
          placeholder="Optional"
          value={squareFeet}
          onChange={(e) => setSquareFeet(e.target.value)}
          error={errors.squareFeet}
        />
        <Input
          label="Monthly Rent ($)"
          type="number"
          min={0}
          step={0.01}
          placeholder="0.00"
          value={rentDollars}
          onChange={(e) => setRentDollars(e.target.value)}
          error={errors.rentAmount}
        />
      </div>

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="AVAILABLE">Available</option>
        <option value="OCCUPIED">Occupied</option>
        <option value="MAINTENANCE">Maintenance</option>
        <option value="OFFLINE">Offline</option>
      </Select>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel ?? (initial ? "Save Changes" : "Add Unit")}
        </Button>
      </div>
    </form>
  );
}
