import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-4xl text-foreground">
          Xonorate Advisory Services
        </h1>
        <p className="mt-3 max-w-md text-muted">
          Advocating for the wrongfully convicted. The public case, petition,
          and news feed launches here soon.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/petitions"
            className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
          >
            View petitions
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted underline transition hover:text-foreground"
          >
            Staff &amp; supporter sign in
          </Link>
        </div>
      </main>
    </>
  );
}
