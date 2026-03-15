"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { createMaintenanceRequest } from "@/services/tenant/adapters/maintenanceAdapter";
import { fetchTenantProfile } from "@/services/tenant/adapters/profileAdapter";
import { fetchTenantLease } from "@/services/tenant/adapters/leaseAdapter";

/**
 * New Maintenance Request — LIVE.
 *
 * POST /api/maintenance is safe (sets created_by_user_id server-side).
 * Uses /tenants/me to get the tenant's unit_id for the request.
 */
export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [description, setDescription] = useState("");
  const [entryPermission, setEntryPermission] = useState<"ANYTIME" | "WITH_NOTICE" | "ACCOMPANIED_ONLY" | "NO_ENTRY">("WITH_NOTICE");
  const [contactPreference, setContactPreference] = useState<"EMAIL" | "PHONE" | "TEXT" | "ANY">("EMAIL");
  const [availabilityNotes, setAvailabilityNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!category.trim() || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get unit_id from tenant profile → lease
      const profileResult = await fetchTenantProfile();
      if (!profileResult.data?.lease_id) {
        setError("Could not determine your unit. Please contact your property manager.");
        return;
      }

      const leaseResult = await fetchTenantLease(profileResult.data.lease_id);
      if (!leaseResult.data?.unit_id) {
        setError("Could not determine your unit. Please contact your property manager.");
        return;
      }

      await createMaintenanceRequest({
        unitId: leaseResult.data.unit_id,
        title: title.trim() || undefined,
        category: category.trim(),
        priority,
        description: description.trim(),
        entryPermission,
        contactPreference,
        availabilityNotes: availabilityNotes.trim() || undefined,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <>
        <PageHeader
          title="New Maintenance Request"
          description="Submit a new maintenance request for your unit."
        />
        <Card className="mt-6">
          <CardBody>
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-emerald-400">Request submitted!</p>
              <p className="mt-2 text-sm text-slate-400">
                Your maintenance request has been sent to your property manager.
                You’ll receive a notification when there’s an update.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button variant="secondary" onClick={() => router.push("/app/maintenance")}>
                  Back to Maintenance
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSuccess(false);
                  setTitle("");
                    setCategory("");
                    setDescription("");
                    setPriority("MEDIUM");
                    setEntryPermission("WITH_NOTICE");
                    setContactPreference("EMAIL");
                    setAvailabilityNotes("");
                  }}
                >
                  Submit another
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="New Maintenance Request"
        description="Submit a new maintenance request for your unit."
        actions={<Badge variant="success">Live</Badge>}
      />

      <Card className="mt-6 max-w-lg">
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title (optional)"
              placeholder="Brief summary, e.g. 'Leaking kitchen faucet'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />

            <Select
              label="Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category…</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="HVAC">HVAC</option>
              <option value="Appliance">Appliance</option>
              <option value="Structural">Structural</option>
              <option value="Pest Control">Pest Control</option>
              <option value="Other">Other</option>
            </Select>

            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent — needs immediate attention</option>
            </Select>

            <Textarea
              label="Description *"
              placeholder="Describe the issue in detail…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />

            <Select
              label="Entry Permission"
              value={entryPermission}
              onChange={(e) => setEntryPermission(e.target.value as any)}
            >
              <option value="ANYTIME">Anytime</option>
              <option value="WITH_NOTICE">With notice</option>
              <option value="ACCOMPANIED_ONLY">Accompanied only</option>
<option value="NO_ENTRY">No entry — I&apos;ll handle access</option>
            </Select>

            <Select
              label="Preferred Contact Method"
              value={contactPreference}
              onChange={(e) => setContactPreference(e.target.value as any)}
            >
              <option value="EMAIL">Email</option>
              <option value="PHONE">Phone</option>
              <option value="TEXT">Text</option>
              <option value="ANY">Any</option>
            </Select>

            <Textarea
              label="Availability Notes (optional)"
              placeholder="e.g. 'Available weekdays after 5pm'"
              value={availabilityNotes}
              onChange={(e) => setAvailabilityNotes(e.target.value)}
              rows={2}
            />

            {error && (
              <p className="rounded-md bg-red-950/30 border border-red-800/50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full">
              Submit Request
            </Button>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
