export default function AccessDeniedPage() {
  return (
    <div className="max-w-md mx-auto space-y-3">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-sm text-slate-300">
        Your account does not have permission to access this area. If you
        believe this is an error, contact your Leasebase administrator.
      </p>
    </div>
  );
}
