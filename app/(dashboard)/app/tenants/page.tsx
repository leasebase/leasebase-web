"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AddTenantModal } from "@/components/tenants/AddTenantModal";
import { apiRequest } from "@/lib/api/client";
import { Users, Plus, Mail, Phone } from "lucide-react";
import Link from "next/link";

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status?: string;
  invitation?: { status: string } | null;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTenant, setShowAddTenant] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      const data = await apiRequest<Tenant[]>({ path: "api/tenants" });
      setTenants(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleTenantCreated = () => {
    setShowAddTenant(false);
    fetchTenants();
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Tenants" description="Manage tenant records." />
        <div className="mt-8 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-slate-800 bg-slate-950/70" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage tenant records, contacts, and lease associations."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setShowAddTenant(true)}>
            Add Tenant
          </Button>
        }
      />

      {tenants.length === 0 ? (
        <EmptyState
          icon={<Users size={48} strokeWidth={1.5} />}
          title="No tenants yet"
          description="Add your first tenant and optionally send them an invitation."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setShowAddTenant(true)}>
              Add Tenant
            </Button>
          }
          className="mt-8"
        />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-400">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Invitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/50">
                  <td className="px-3 py-2.5">
                    <Link href={`/app/tenants/${t.id}`} className="font-medium text-slate-100 hover:text-white">
                      {t.firstName} {t.lastName}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-xs text-slate-300">
                        <Mail size={11} /> {t.email}
                      </span>
                      {t.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Phone size={11} /> {t.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {t.invitation ? (
                      <Badge variant={t.invitation.status === "ACCEPTED" ? "success" : "warning"}>
                        {t.invitation.status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-500">Not invited</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddTenant && (
        <AddTenantModal onClose={() => setShowAddTenant(false)} onCreated={handleTenantCreated} />
      )}
    </>
  );
}
