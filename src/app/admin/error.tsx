"use client";

/** Catches errors thrown anywhere in the admin route tree (including
 * Server Actions that don't handle their own errors) so a bad save shows a
 * recoverable message instead of leaving the whole page unresponsive. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="font-serif text-xl text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        {error.message || "That action didn't go through. Nothing else was changed."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
