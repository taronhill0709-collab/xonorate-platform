import { Search } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { MobileNav } from "@/components/mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { XonorateMark } from "@/components/xonorate-mark";

// Simplified per the Xonorate 2.0 brief's nav spec: Cases / News / The
// Issues / Take Action / About, plus account links and the Submit a Case
// button. Petitions, Exonerated, Resources, and Submit an inquiry were
// dropped from the top-level nav — they're still real pages, reachable via
// the footer, the Take Action page (which lists petitions directly), and
// Cases' own status filter (which includes Exonerated).
const PRIMARY_LINKS = [
  { href: "/cases", label: "Cases" },
  { href: "/news", label: "News" },
  { href: "/issues", label: "The Issues" },
  { href: "/take-action", label: "Take Action" },
  { href: "/about", label: "About" },
] as const;

export async function SiteHeader() {
  const session = await auth();

  const navLinks = (
    <>
      {PRIMARY_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground"
        >
          {link.label}
        </Link>
      ))}
      {session?.user ? (
        <>
          <Link
            href="/dashboard"
            className="text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground"
          >
            Dashboard
          </Link>
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className="text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground"
            >
              Admin
            </Link>
          )}
          <SignOutButton className="text-xs font-bold tracking-widest text-header-muted uppercase hover:text-header-foreground" />
        </>
      ) : (
        <Link
          href="/login"
          className="text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground"
        >
          Sign in
        </Link>
      )}
      <Link
        href="/search"
        aria-label="Search"
        className="text-header-muted transition hover:text-header-foreground"
      >
        <Search size={16} />
      </Link>
      <Link
        href="/submit-case"
        className="bg-brand px-4 py-2 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent sm:ml-2"
      >
        Submit a case
      </Link>
    </>
  );

  return (
    <header className="relative border-b border-header-border bg-header-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <XonorateMark className="h-7 w-7 text-brand" />
          <span>
            <span className="block font-display text-2xl leading-none font-bold tracking-[0.06em] text-header-foreground uppercase">
              onorate
            </span>
            <span className="mt-0.5 hidden text-[9px] font-semibold tracking-[0.2em] text-header-muted uppercase sm:block">
              Truth. Justice. Accountability.
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {navLinks}
        </nav>
        <MobileNav>{navLinks}</MobileNav>
      </div>
    </header>
  );
}
