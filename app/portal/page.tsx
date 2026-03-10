"use client";

import { Building2, Home, User } from "lucide-react";
import { getPortalOrigin } from "@/lib/hostname";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";

interface PortalOption {
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const portalOptions: PortalOption[] = [
  {
    label: "Owner / Landlord Portal",
    description: "Manage your properties, leases, and tenants",
    icon: <Home size={22} />,
    href: getPortalOrigin("owner"),
  },
  {
    label: "Property Manager Portal",
    description: "Manage properties on behalf of owners",
    icon: <Building2 size={22} />,
    href: getPortalOrigin("manager"),
  },
  {
    label: "Tenant Portal",
    description: "Pay rent, submit requests, and view your lease",
    icon: <User size={22} />,
    href: getPortalOrigin("tenant"),
  },
];

export default function PortalSelectorPage() {
  return (
    <AuthShell>
      <AuthCard className="max-w-lg">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Sign in to LeaseBase
            </h2>
            <p className="text-sm text-slate-500">
              Choose your portal to continue.
            </p>
          </div>

          <div className="space-y-3">
            {portalOptions.map((option) => (
              <a
                key={option.label}
                href={option.href}
                className="flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-brand-500 hover:bg-brand-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">
                    {option.label}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {option.description}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <a
              href={getPortalOrigin("signup")}
              className="font-medium text-brand-600 hover:text-brand-500 transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
