"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { CreatePropertyDTO, PropertyRow } from "@/services/properties/types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
] as const;

interface PropertyFormProps {
  /** If provided, the form is in edit mode with initial values. */
  initial?: PropertyRow;
  onSubmit: (data: CreatePropertyDTO) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

interface FormErrors {
  name?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

function validate(data: CreatePropertyDTO): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Property name is required";
  if (!data.addressLine1.trim()) errors.addressLine1 = "Address is required";
  if (!data.city.trim()) errors.city = "City is required";
  if (!data.state.trim()) errors.state = "State is required";
  if (!data.postalCode.trim()) errors.postalCode = "ZIP code is required";
  else if (!/^\d{5}(-\d{4})?$/.test(data.postalCode.trim()))
    errors.postalCode = "Enter a valid ZIP code (e.g. 90210)";
  return errors;
}

export function PropertyForm({ initial, onSubmit, onCancel, submitLabel }: PropertyFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [addressLine1, setAddressLine1] = useState(initial?.address_line1 ?? "");
  const [addressLine2, setAddressLine2] = useState(initial?.address_line2 ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const dto: CreatePropertyDTO = {
      name: name.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: "US",
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
        label="Property Name"
        placeholder="e.g. Sunset Apartments"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        required
      />

      <Input
        label="Address Line 1"
        placeholder="123 Main St"
        value={addressLine1}
        onChange={(e) => setAddressLine1(e.target.value)}
        error={errors.addressLine1}
        required
      />

      <Input
        label="Address Line 2"
        placeholder="Suite 100 (optional)"
        value={addressLine2}
        onChange={(e) => setAddressLine2(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="City"
          placeholder="Los Angeles"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          error={errors.city}
          required
        />

        <Select
          label="State"
          value={state}
          onChange={(e) => setState(e.target.value)}
          error={errors.state}
          required
        >
          <option value="">Select state…</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>

        <Input
          label="ZIP Code"
          placeholder="90210"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          error={errors.postalCode}
          required
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel ?? (initial ? "Save Changes" : "Create Property")}
        </Button>
      </div>
    </form>
  );
}
