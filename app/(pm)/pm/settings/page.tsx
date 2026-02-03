"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api, toApiError } from "@/lib/api/http";
import type { OrgProfile, OrgUser } from "@/lib/api/types";

export default function SettingsPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const load = async () => {
    try {
      const [p, u] = await Promise.all([
        api.get<OrgProfile>("/pm/settings/org"),
        api.get<OrgUser[]>("/pm/settings/users")
      ]);
      setProfile(p.data);
      setUsers(u.data);
      setError(null);
    } catch (err) {
      const e = toApiError(err);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/pm/settings/users", { email: inviteEmail });
      toast.show("User invited.");
      setInviteEmail("");
      load();
    } catch (err) {
      const e = toApiError(err);
      toast.show(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Organization settings"
        description="Manage organization profile, users, and roles."
      />
      {loading && <p className="text-sm text-slate-300">Loading settings…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {profile && (
        <div className="text-sm text-slate-200">
          <p>Name: {profile.name}</p>
          {profile.slug && <p>Slug: {profile.slug}</p>}
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-200">Users</h2>
        <DataTable<OrgUser>
          columns={[
            { key: "email", header: "Email" },
            { key: "role", header: "Role" },
            { key: "status", header: "Status" }
          ]}
          rows={users}
          getRowId={(u) => u.id}
          emptyMessage="No users yet. Invite a user to get started."
        />
        <form className="mt-3 flex gap-2 text-sm" onSubmit={inviteUser}>
          <FormField label="Invite user">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              required
            />
          </FormField>
          <button
            type="submit"
            className="self-end rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            Invite
          </button>
        </form>
      </div>
    </div>
  );
}
