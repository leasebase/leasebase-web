"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardBody } from "@/components/ui/Card";
import { Users, Plus, Star, Archive, ArrowLeft } from "lucide-react";
import {
  fetchVendors, createVendor, archiveVendor,
  type Vendor,
} from "@/services/maintenance/maintenanceApiService";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isPreferred, setIsPreferred] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchVendors({ limit: 100 });
      setVendors(res.data);
      setTotal(res.meta.total);
    } catch (e: any) { setError(e?.message || "Failed to load vendors"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createVendor({
        name: name.trim(),
        company: company.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        specialty: specialty || undefined,
        isPreferred,
      });
      setName(""); setCompany(""); setEmail(""); setPhone(""); setSpecialty(""); setIsPreferred(false);
      setShowCreate(false);
      await loadVendors();
    } catch (e: any) { setError(e?.message || "Failed to create vendor"); }
    finally { setCreating(false); }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this vendor? They won't appear in assignment lists.")) return;
    try {
      await archiveVendor(id);
      await loadVendors();
    } catch (e: any) { setError(e?.message || "Failed to archive vendor"); }
  }

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Manage your maintenance vendors and contractors."
        actions={
          <div className="flex gap-2">
            <Link href="/app/maintenance">
              <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />}>Back</Button>
            </Link>
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? "Cancel" : "Add Vendor"}
            </Button>
          </div>
        }
      />

      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Inline create form */}
      {showCreate && (
        <Card className="mt-4">
          <CardBody>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Smith" />
              <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ABC Plumbing" />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              <Select label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                <option value="">Select…</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC</option>
                <option value="Appliance">Appliance</option>
                <option value="General">General</option>
                <option value="Structural">Structural</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Landscaping">Landscaping</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Other">Other</option>
              </Select>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={isPreferred} onChange={(e) => setIsPreferred(e.target.checked)} className="rounded border-slate-300" />
                  Preferred vendor
                </label>
              </div>
              <div className="col-span-2">
                <Button type="submit" loading={creating}>Create Vendor</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Vendor list */}
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="text" className="h-16 w-full rounded-md" />)}
          </div>
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={<Users size={48} strokeWidth={1.5} />}
            title="No vendors yet"
            description="Add your first vendor to start assigning work orders."
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Add Vendor</Button>}
          />
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3">{total} vendor{total !== 1 ? "s" : ""}</p>
            <div className="space-y-2">
              {vendors.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                  <Link href={`/app/maintenance/vendors/${v.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{v.name}</p>
                      {v.is_preferred && <Star size={12} className="text-amber-500 fill-amber-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {v.company && `${v.company} · `}{v.specialty || "General"}{v.email && ` · ${v.email}`}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {v.specialty && <Badge variant="neutral">{v.specialty}</Badge>}
                    <Button variant="secondary" size="sm" icon={<Archive size={12} />} onClick={() => handleArchive(v.id)} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
