import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { MobileNav } from "@/components/mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { XonorateMark } from "@/components/xonorate-mark";

// Cases / Investigates / Issues / Knowledge / Take Action / About, plus
// account links and the Submit a Case button. Petitions, Exonerated, and
// Submit an inquiry stay dropped from the top-level nav — they're still
// real pages, reachable via the footer, the Take Action page (which lists
// petitions directly), and Cases' own status filter (which includes
// Exonerated). "Investigates" links to /news — that route wasn't renamed
// (existing article URLs stay valid), only its public identity was.
//
// Knowledge replaces the old plain "Resources" link with a mega-menu:
// Xonorate's knowledge ecosystem (Resource Center + Ask Xonorate + the
// Resource Center's own category wayfinding) is now positioned as one of
// the platform's core pillars rather than a single easy-to-skip nav item.
// It routes entirely to existing pages/query params — no new routes.
const PRIMARY_LINKS_BEFORE_KNOWLEDGE = [
  { href: "/cases", label: "Cases" },
  { href: "/news", label: "Investigates" },
  { href: "/issues", label: "Issues" },
] as const;

const KNOWLEDGE_FEATURED_LINKS = [
  {
    href: "/resources",
    label: "Resource Center",
    dek: "Explore practical guides, research, legal information, case resources, and educational material.",
  },
  {
    href: "/ask",
    label: "Ask Xonorate",
    dek: "Ask questions and explore research grounded in Xonorate's verified knowledge base.",
  },
] as const;

const KNOWLEDGE_TOPIC_LINKS = [
  {
    href: "/resources/browse?category=research",
    label: "Research & Data",
    dek: "Explore research and data surrounding wrongful convictions and exonerations.",
  },
  {
    href: "/resources/browse?category=legal",
    label: "Legal Resources",
    dek: "Find legal information, organizations, and jurisdiction-specific resources.",
  },
  {
    href: "/resources/browse?category=help_support",
    label: "For Families",
    dek: "Resources for families navigating wrongful convictions and post-conviction issues.",
  },
  {
    href: "/resources/browse?category=knowledge",
    label: "Know Your Rights",
    dek: "Educational information about rights and the criminal legal system.",
  },
] as const;

export async function SiteHeader() {
  const session = await auth();

  const navLinks = (
    <>
      {PRIMARY_LINKS_BEFORE_KNOWLEDGE.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground"
        >
          {link.label}
        </Link>
      ))}
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground [&::-webkit-details-marker]:hidden">
          Knowledge
          <ChevronDown size={14} className="transition group-open:rotate-180" />
        </summary>
        <div className="mt-2 flex flex-col gap-6 sm:absolute sm:z-30 sm:mt-3 sm:w-[36rem] sm:flex-row sm:gap-0 sm:border sm:border-header-border sm:bg-header-background sm:shadow-lg">
          <div className="flex flex-col gap-1 sm:w-56 sm:shrink-0 sm:border-r sm:border-header-border sm:p-3">
            {KNOWLEDGE_FEATURED_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block p-2 normal-case transition hover:bg-white/5"
              >
                <span className="text-xs font-bold tracking-wide text-brand uppercase">{link.label}</span>
                <span className="mt-1 block text-xs leading-snug text-header-muted">{link.dek}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-1 sm:flex-1 sm:p-3">
            {KNOWLEDGE_TOPIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block p-2 normal-case transition hover:bg-white/5"
              >
                <span className="text-xs font-bold tracking-wide text-header-foreground uppercase">
                  {link.label}
                </span>
                <span className="mt-1 block text-xs leading-snug text-header-muted">{link.dek}</span>
              </Link>
            ))}
          </div>
        </div>
      </details>
      <Link
        href="/take-action"
        className="text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground"
      >
        Take Action
      </Link>
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
