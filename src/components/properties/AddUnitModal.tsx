"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/api/client";

interface AddUnitModalProps {
  propertyId: string;
  propertyName: string;
  onClose: () => void;
  onCreated: (unit: any) => void;
}

export function AddUnitModal({ propertyId, propertyName, onClose, onCreated }: AddUnitModalProps) {
  const [unitNumber, setUnitNumber] = useState("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [squareFeet, setSquareFeet] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formValid = unitNumber.length > 0 && rentAmount.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const unit = await apiRequest({
        path: `api/properties/${propertyId}/units`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitNumber,
          bedrooms,
          bathrooms,
          squareFeet: squareFeet ? parseInt(squareFeet) : undefined,
          rentAmount: Math.round(parseFloat(rentAmount) * 100), // convert dollars to cents
          securityDeposit: securityDeposit ? Math.round(parseFloat(securityDeposit) * 100) : undefined,
        }),
      });
      onCreated(unit);
    } catch (err: any) {
      setError(err.message || "Failed to create unit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:text-slate-200" aria-label="Close">
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-slate-100 mb-1">Add Unit</h2>
        <p className="text-xs text-slate-400 mb-4">for {propertyName}</p>

        {error && <p className="text-sm text-red-400 mb-3" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Unit Number *</label>
            <input type="text" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" placeholder="e.g. 101, A" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Bedrooms</label>
              <input type="number" value={bedrooms} min={0} onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" />
            </div>
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Bathrooms</label>
              <input type="number" value={bathrooms} min={0} step={0.5} onChange={(e) => setBathrooms(parseFloat(e.target.value) || 0)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Square Feet</label>
            <input type="number" value={squareFeet} min={0} onChange={(e) => setSquareFeet(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Monthly Rent ($) *</label>
              <input type="number" value={rentAmount} min={0} step={0.01} onChange={(e) => setRentAmount(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" placeholder="2000.00" required />
            </div>
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Security Deposit ($)</label>
              <input type="number" value={securityDeposit} min={0} step={0.01} onChange={(e) => setSecurityDeposit(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" />
            </div>
          </div>

          <button type="submit" disabled={loading || !formValid} className="mt-2 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Creating…" : "Add Unit"}
          </button>
        </form>
      </div>
    </div>
  );
}
