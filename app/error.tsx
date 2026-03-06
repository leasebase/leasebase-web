"use client";

/**
 * Page-level error boundary — catches unhandled errors in any page rendered
 * inside the root layout.  The root layout's <html>/<body> remain intact so
 * Tailwind classes still work.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-slate-400">
          An unexpected error occurred while loading this page.
          {error.digest && (
            <span className="block mt-1 text-xs text-slate-500">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className="mt-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
