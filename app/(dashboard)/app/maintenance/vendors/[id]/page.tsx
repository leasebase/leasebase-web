"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardBody } from "@/components/ui/Card";
import { ArrowLeft, Star, Save } from "lucide-react";
import {
  fetchVendor, updateVendor, archiveVendor,
  fetchMaintenanceList,
  type Vendor, type MaintenanceWorkOrder,
} from "@/services/maintenance/maintenanceApiService";

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [isPreferred, setIsPreferred] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vRes, woRes] = await Promise.all([
        fetchVendor(id),
        fetchMaintenanceList({ limit: 50 }), // We'll filter client-side by vendor_id
      ]);
      const v = vRes.data;
      setVendor(v);
      setName(v.name); setCompany(v.company || ""); setEmail(v.email || "");
      setPhone(v.phone || ""); setSpecialty(v.specialty || ""); setNotes(v.notes || "");
      setIsPreferred(v.is_preferred);
      // Filter WOs assigned to this vendor
      setWorkOrders(woRes.data.filter((wo) => (wo as any).vendor_id === id));
    } catch (e: any) { setError(e?.message || "Failed to load vendor"); }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateVendor(id, {
        name: name.trim(), company: company.trim() || null, email: email.trim() || null,
        phone: phone.trim() || null, specialty: specialty || null, notes: notes.trim() || null,
        isPreferred,
      });
      setVendor(res.data);
    } catch (e: any) { setError(e?.message || "Failed to save"); }
    finally { setSaving(false); }
  }

  async function handleArchive() {
    if (!confirm("Archive this vendor?")) return;
    try {
      await archiveVendor(id);
      router.push("/app/maintenance/vendors");
    } catch (e: any) { setError(e?.message || "Failed to archive"); }
  }

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-40 w-full rounded-lg" /></div>;
  if (error && !vendor) return <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!vendor) return null;

  return (
    <>
      <PageHeader
        title={vendor.name}
        description={vendor.company || "Vendor details"}
        actions={
          <div className="flex gap-2">
            <Link href="/app/maintenance/vendors"><Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />}>Back</Button></Link>
            {vendor.status === "ACTIVE" && <Button variant="danger" size="sm" onClick={handleArchive}>Archive</Button>}
          </div>
        }
      />
      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Select label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                <option value="">Select…</option>
                <option value="Plumbing">Plumbing</option><option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC</option><option value="Appliance">Appliance</option>
                <option value="General">General</option><option value="Structural">Structural</option>
                <option value="Pest Control">Pest Control</option><option value="Landscaping">Landscaping</option>
                <option value="Cleaning">Cleaning</option><option value="Other">Other</option>
              </Select>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={isPreferred} onChange={(e) => setIsPreferred(e.target.checked)} className="rounded border-slate-300" />
                  <Star size={12} className={isPreferred ? "text-amber-500 fill-amber-500" : "text-slate-400"} /> Preferred
                </label>
              </div>
              <div className="col-span-2">
                <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <div className="col-span-2">
                <Button icon={<Save size={14} />} loading={saving} onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Info sidebar */}
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={vendor.status === "ACTIVE" ? "success" : "neutral"}>{vendor.status}</Badge>
                {vendor.is_preferred && <Badge variant="warning">Preferred</Badge>}
              </div>
              <p className="text-xs text-slate-500">Created {new Date(vendor.created_at).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500">{workOrders.length} assigned work order{workOrders.length !== 1 ? "s" : ""}</p>
            </CardBody>
          </Card>

          {workOrders.length > 0 && (
            <Card>
              <CardBody>
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Assigned Work Orders</h4>
                <div className="space-y-1">
                  {workOrders.map((wo) => (
                    <Link key={wo.id} href={`/app/maintenance/${wo.id}`} className="block text-sm text-brand-600 hover:text-brand-700 truncate">
                      {wo.title || wo.description}
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
