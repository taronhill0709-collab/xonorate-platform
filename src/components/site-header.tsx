import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { MobileNav } from "@/components/mobile-nav";
import { SignOutButton } from "@/components/sign-out-button";

const RESOURCE_LINKS = [
  { href: "/resources#know-your-rights", label: "Know Your Rights" },
  { href: "/resources#innocence-organizations", label: "Innocence Organizations" },
  { href: "/resources#legal-resources", label: "Legal Resources" },
  { href: "/resources#justice-reform", label: "Justice Reform" },
  { href: "/resources#support-services", label: "Support Services" },
] as const;

export async function SiteHeader() {
  const session = await auth();

  const navLinks = (
    <>
      <Link
        href="/cases"
        className="text-header-muted transition hover:text-header-foreground"
      >
        Cases
      </Link>
      <Link
        href="/petitions"
        className="text-header-muted transition hover:text-header-foreground"
      >
        Petitions
      </Link>
      <Link
        href="/exonerated"
        className="text-header-muted transition hover:text-header-foreground"
      >
        Exonerated
      </Link>
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-header-muted transition hover:text-header-foreground [&::-webkit-details-marker]:hidden">
          Resources
          <ChevronDown size={14} className="transition group-open:rotate-180" />
        </summary>
        <div className="mt-2 flex flex-col gap-2 sm:absolute sm:z-30 sm:mt-3 sm:w-56 sm:gap-1 sm:rounded-md sm:border sm:border-header-border sm:bg-header-background sm:p-2 sm:shadow-lg">
          {RESOURCE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-header-muted transition hover:text-header-foreground sm:rounded sm:px-2 sm:py-1.5 sm:hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </details>
      <Link
        href="/about"
        className="text-header-muted transition hover:text-header-foreground"
      >
        About
      </Link>
      <Link
        href="/submit-case"
        className="text-header-muted transition hover:text-header-foreground"
      >
        Submit a case
      </Link>
      <Link
        href="/submit-inquiry"
        className="text-header-muted transition hover:text-header-foreground"
      >
        Submit an inquiry
      </Link>
      {session?.user ? (
        <>
          <Link
            href="/dashboard"
            className="text-header-muted transition hover:text-header-foreground"
          >
            Dashboard
          </Link>
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className="text-header-muted transition hover:text-header-foreground"
            >
              Admin
            </Link>
          )}
          <SignOutButton className="text-header-muted hover:text-header-foreground" />
        </>
      ) : (
        <Link
          href="/login"
          className="text-header-muted transition hover:text-header-foreground"
        >
          Sign in
        </Link>
      )}
    </>
  );

  return (
    <header className="relative border-b border-header-border bg-header-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/xonorate-mark.svg"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0"
          />
          <span className="h-9 w-px bg-header-border" aria-hidden />
          <span className="font-display text-2xl font-semibold tracking-[0.08em] text-header-foreground">
            XONORATE
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
