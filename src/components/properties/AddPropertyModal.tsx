"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/api/client";

const PROPERTY_TYPES = [
  { value: "SINGLE_FAMILY", label: "Single Family" },
  { value: "MULTI_FAMILY", label: "Multi Family" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "CONDO", label: "Condo" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "OTHER", label: "Other" },
];

interface AddPropertyModalProps {
  onClose: () => void;
  onCreated: (property: any) => void;
}

export function AddPropertyModal({ onClose, onCreated }: AddPropertyModalProps) {
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState("MULTI_FAMILY");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [numberOfUnits, setNumberOfUnits] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formValid =
    name.length > 0 &&
    addressLine1.length > 0 &&
    city.length > 0 &&
    state.length > 0 &&
    postalCode.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const property = await apiRequest({
        path: "api/properties",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          propertyType,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state,
          postalCode,
          country,
          numberOfUnits,
        }),
      });
      onCreated(property);
    } catch (err: any) {
      setError(err.message || "Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:text-slate-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-slate-100 mb-4">Add Property</h2>

        {error && <p className="text-sm text-red-400 mb-3" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Property Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
              placeholder="e.g. Sunset Apartments"
              required
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Address Line 1 *</label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
              required
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Address Line 2</label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                required
              />
            </div>
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">State *</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Postal Code *</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                required
              />
            </div>
            <div className="space-y-1 text-sm">
              <label className="block text-slate-200">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Number of Units</label>
            <input
              type="number"
              value={numberOfUnits}
              min={1}
              onChange={(e) => setNumberOfUnits(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formValid}
            className="mt-2 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Create Property"}
          </button>
        </form>
      </div>
    </div>
  );
}
