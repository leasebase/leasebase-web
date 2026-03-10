"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createInvitation } from "@/services/invitations/invitationApiService";

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

  function reset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPropertyId(propertyUnit?.propertyId ?? "");
    setUnitId(propertyUnit?.unitId ?? "");
    setError(null);
    setSuccess(false);
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
      setError(err.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  }

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
              <Input
                label="Property ID"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                required
                placeholder="Property UUID"
                helperText="Enter the property ID. Property/unit selectors coming soon."
              />
              <Input
                label="Unit ID"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                required
                placeholder="Unit UUID"
              />
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
