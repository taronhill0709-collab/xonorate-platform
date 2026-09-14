import { Search } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { MobileNav } from "@/components/mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { XonorateMark } from "@/components/xonorate-mark";

// Simplified per the Xonorate 2.0 brief's nav spec: Cases / Investigates /
// The Issues / Take Action / Resources / About, plus account links and the
// Submit a Case button. Petitions, Exonerated, and Submit an inquiry stay
// dropped from the top-level nav — they're still real pages, reachable via
// the footer, the Take Action page (which lists petitions directly), and
// Cases' own status filter (which includes Exonerated). Resources used to
// be a dropdown of anchors into one static page — now that /resources is a
// real Resource Center hub with its own category/pathway wayfinding on the
// page itself, a plain link replaces the dropdown rather than duplicating
// that navigation in two places. "Investigates" links to /news — that route
// wasn't renamed (existing article URLs stay valid), only its public
// identity was.
const PRIMARY_LINKS = [
  { href: "/cases", label: "Cases" },
  { href: "/news", label: "Investigates" },
  { href: "/issues", label: "The Issues" },
  { href: "/take-action", label: "Take Action" },
  { href: "/resources", label: "Resources" },
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
      <Link
        href="/about"
        className="text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground"
      >
        About
      </Link>
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
        <Link href="/" className="flex flex-col">
          <span className="flex items-center gap-1">
            <XonorateMark className="h-6 w-6 shrink-0 text-brand" />
            <span className="font-display text-2xl leading-none font-bold tracking-tight text-header-foreground uppercase">
              onorate
            </span>
          </span>
          <span className="mt-0.5 hidden text-[9px] font-semibold tracking-[0.2em] text-header-muted uppercase sm:block">
            Truth. Justice. Accountability.
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
