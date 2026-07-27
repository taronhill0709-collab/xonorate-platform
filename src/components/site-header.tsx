import Link from "next/link";
import { auth } from "@/auth";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-lg text-foreground">
          Xonorate
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/petitions" className="text-muted transition hover:text-foreground">
            Petitions
          </Link>
          <Link
            href="/submit-inquiry"
            className="text-muted transition hover:text-foreground"
          >
            Submit an inquiry
          </Link>
          {session?.user ? (
            <Link href="/dashboard" className="text-muted transition hover:text-foreground">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-muted transition hover:text-foreground">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
