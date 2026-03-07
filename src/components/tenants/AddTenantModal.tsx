"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/api/client";

interface Property {
  id: string;
  name: string;
  units?: { id: string; unitNumber: string }[];
}

interface AddTenantModalProps {
  onClose: () => void;
  onCreated: (tenant: any) => void;
}

export function AddTenantModal({ onClose, onCreated }: AddTenantModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [sendInvitation, setSendInvitation] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest<Property[]>({ path: "api/properties" })
      .then(setProperties)
      .catch(() => {});
  }, []);

  const selectedProperty = properties.find((p) => p.id === propertyId);

  const formValid = firstName.length > 0 && lastName.length > 0 && email.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tenant = await apiRequest({
        path: "api/tenants",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          propertyId: propertyId || undefined,
          unitId: unitId || undefined,
          sendInvitation,
        }),
      });
      onCreated(tenant);
    } catch (err: any) {
      setError(err.message || "Failed to create tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:text-slate-200" aria-label="Close">
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-slate-100 mb-4">Add Tenant</h2>

        {error && <p className="text-sm text-red-400 mb-3" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">First Name *</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" required />
            </div>
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Last Name *</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" required />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" required />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" />
          </div>

          {properties.length > 0 && (
            <>
              <div className="space-y-1 text-sm">
                <label className="block text-slate-200">Assign to Property</label>
                <select value={propertyId} onChange={(e) => { setPropertyId(e.target.value); setUnitId(""); }} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm">
                  <option value="">— None —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProperty?.units && selectedProperty.units.length > 0 && (
                <div className="space-y-1 text-sm">
                  <label className="block text-slate-200">Assign to Unit</label>
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm">
                    <option value="">— None —</option>
                    {selectedProperty.units.map((u) => (
                      <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-200 pt-1">
            <input type="checkbox" checked={sendInvitation} onChange={(e) => setSendInvitation(e.target.checked)} className="rounded border-slate-600 bg-slate-800" />
            Send invitation email to tenant
          </label>

          <button type="submit" disabled={loading || !formValid} className="mt-2 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Creating…" : "Add Tenant"}
          </button>
        </form>
      </div>
    </div>
  );
}
