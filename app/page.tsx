import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Leasebase Web</h1>
      <p className="text-sm text-slate-300 max-w-2xl">
        This is the Next.js frontend for Leasebase. It provides role-based
        experiences for Property Managers / Landlords and Tenants, backed by
        the Leasebase API.
      </p>
      <div className="flex gap-3 mt-2">
        <Link
          href="/auth/login"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Sign in
        </Link>
        <Link
          href="/tenant"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
        >
          Tenant demo
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold mb-2">Property manager / landlord</h2>
          <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
            <li>Dashboard (occupancy, delinquency, open work orders)</li>
            <li>Properties, units, leases, and per-lease ledger views</li>
            <li>Maintenance work orders, documents, org settings, billing</li>
          </ul>
        </section>
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold mb-2">Tenant</h2>
          <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
            <li>Dashboard (balance, next due date, open maintenance)</li>
            <li>Pay rent, view payment history and receipts</li>
            <li>Maintenance requests with photos, status, and comments</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
