import Link from "next/link";
import { auth } from "@/auth";
import { MobileNav } from "@/components/mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await auth();

  const navLinks = (
    <>
      <Link
        href="/cases"
        className="text-muted transition hover:text-foreground"
      >
        Cases
      </Link>
      <Link
        href="/petitions"
        className="text-muted transition hover:text-foreground"
      >
        Petitions
      </Link>
      <Link
        href="/posts"
        className="text-muted transition hover:text-foreground"
      >
        News
      </Link>
      <Link
        href="/submit-inquiry"
        className="text-muted transition hover:text-foreground"
      >
        Submit an inquiry
      </Link>
      {session?.user ? (
        <>
          <Link
            href="/dashboard"
            className="text-muted transition hover:text-foreground"
          >
            Dashboard
          </Link>
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className="text-muted transition hover:text-foreground"
            >
              Admin
            </Link>
          )}
          <SignOutButton />
        </>
      ) : (
        <Link
          href="/login"
          className="text-muted transition hover:text-foreground"
        >
          Sign in
        </Link>
      )}
    </>
  );

  return (
    <header className="relative border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-lg text-foreground">
          Xonorate
        </Link>
        <nav className="hidden items-center gap-5 text-sm sm:flex">
          {navLinks}
        </nav>
        <MobileNav>{navLinks}</MobileNav>
      </div>
    </header>
  );
}
