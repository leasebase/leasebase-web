"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createInvitation, InvitationApiError } from "@/services/invitations/invitationApiService";
import { fetchProperties, fetchUnitsForProperty } from "@/services/properties/propertyService";
import type { PropertyRow, UnitRow } from "@/services/properties/types";

const ERROR_MESSAGES: Record<string, string> = {
  TENANT_ALREADY_INVITED:
    "A pending invitation has already been sent to this email address for this unit. Use the Invitations page to resend or revoke it.",
  TENANT_ALREADY_EXISTS:
    "A user with this email address already exists in your organization.",
  ACTIVE_LEASE_EXISTS:
    "This unit already has an active lease. Terminate the existing lease before inviting a new tenant.",
};

interface PropertyUnit {
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
}

interface InviteTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Pre-selected property/unit context (optional). */
  propertyUnit?: PropertyUnit;
}

export function InviteTenantModal({ open, onClose, onSuccess, propertyUnit }: InviteTenantModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyId, setPropertyId] = useState(propertyUnit?.propertyId ?? "");
  const [unitId, setUnitId] = useState(propertyUnit?.unitId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Property/unit selector state
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Fetch properties when modal opens (only if no pre-selected propertyUnit)
  useEffect(() => {
    if (!open || propertyUnit) return;
    setLoadingProperties(true);
    fetchProperties(1, 100)
      .then((res) => setProperties(res.data))
      .catch(() => {}) // silent — selector will be empty
      .finally(() => setLoadingProperties(false));
  }, [open, propertyUnit]);

  // Fetch units when property selection changes
  useEffect(() => {
    if (!propertyId || propertyUnit) { setUnits([]); return; }
    setLoadingUnits(true);
    setUnitId(""); // reset unit when property changes
    fetchUnitsForProperty(propertyId, 1, 200)
      .then((res) => setUnits(res.data))
      .catch(() => setUnits([]))
      .finally(() => setLoadingUnits(false));
  }, [propertyId, propertyUnit]);

  function reset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPropertyId(propertyUnit?.propertyId ?? "");
    setUnitId(propertyUnit?.unitId ?? "");
    setError(null);
    setSuccess(false);
    setUnits([]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createInvitation({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        propertyId,
        unitId,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      const code = err instanceof InvitationApiError ? err.code : undefined;
      setError(
        (code && ERROR_MESSAGES[code]) ||
          err.message ||
          "Failed to send invitation",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50";

  return (
    <Modal open={open} onClose={handleClose} title="Invite Tenant">
      {success ? (
        <div className="space-y-4 text-center py-4">
          <div className="text-2xl">✉️</div>
          <p className="text-sm text-slate-700">
            Invitation sent to <strong>{email}</strong>
          </p>
          <p className="text-xs text-slate-500">
            They will receive an email with a link to set their password and access their portal.
          </p>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Jane"
            />
            <Input
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Smith"
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jane@example.com"
          />

          <Input
            label="Phone (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 123 4567"
          />

          {!propertyUnit && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Property</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  required
                  disabled={loadingProperties}
                  className={selectClass}
                >
                  <option value="">{loadingProperties ? "Loading properties…" : "Select a property"}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.address_line1}, {p.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Unit</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                  disabled={!propertyId || loadingUnits}
                  className={selectClass}
                >
                  <option value="">
                    {!propertyId ? "Select a property first" : loadingUnits ? "Loading units…" : "Select a unit"}
                  </option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unit_number}
                      {u.status === "OCCUPIED" ? " (occupied)" : ""}
                      {(u.status === "VACANT" || u.status === "AVAILABLE") ? " (vacant)" : ""}
                      {u.status === "MAINTENANCE" ? " (maintenance)" : ""}
                    </option>
                  ))}
                </select>
                {propertyId && !loadingUnits && units.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">No units found for this property.</p>
                )}
              </div>
            </>
          )}

          {propertyUnit && (
            <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
              <span className="font-medium">{propertyUnit.propertyName}</span>
              {" — Unit "}
              <span className="font-medium">{propertyUnit.unitNumber}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
