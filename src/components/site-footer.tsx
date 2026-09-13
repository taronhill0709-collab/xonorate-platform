import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { NewsletterForm } from "@/components/newsletter-form";
import { XonorateMark } from "@/components/xonorate-mark";

// lucide-react dropped brand icons — these are small enough to hand-draw.
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7c-.28-.04-1.25-.12-2.37-.12-2.35 0-3.95 1.43-3.95 4.06V10H7.6v3.1h2.78v8h3.12Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Per the user's explicit footer layout (2026-09-12): lead with the
// Xonorate brand itself, not "Xonorate Media Platform" — that name is
// demoted to a small attribution line so it stops competing with the
// brand. "Investigations" deep-links to the Xonorate Investigates page's
// "investigations" topic filter (NEWSROOM_TOPICS), since original
// investigative work is the flagship tier worth surfacing on its own.
// About/Contact are intentionally dropped from this row (About stays in
// the header nav; Contact/submit-inquiry stays reachable from Take Action
// and the About page) — this footer is deliberately narrower than the
// last one.
const FOOTER_LINKS = [
  { href: "/cases", label: "Cases" },
  { href: "/news", label: "Investigates" },
  { href: "/news?type=investigations", label: "Investigations" },
  { href: "/issues", label: "Issues" },
  { href: "/take-action", label: "Take Action" },
];

export async function SiteFooter() {
  const [settings] = await db
    .select({
      facebookUrl: siteSettings.facebookUrl,
      instagramUrl: siteSettings.instagramUrl,
    })
    .from(siteSettings)
    .where(eq(siteSettings.id, "singleton"))
    .limit(1);

  const year = new Date().getFullYear();

  return (
    <>
      <section className="bg-brand">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-lg text-brand-foreground">
              Stay informed. Stay involved.
            </p>
            <p className="mt-1 text-sm text-brand-foreground/75">
              Get the latest updates on cases, petitions, and justice reform.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <footer className="border-t border-header-border bg-header-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div>
              <Link href="/" className="flex flex-col">
                <span className="flex items-center gap-1">
                  <XonorateMark className="h-6 w-6 shrink-0 text-brand" />
                  <span className="font-display text-xl leading-none font-bold tracking-tight text-header-foreground uppercase">
                    onorate
                  </span>
                </span>
                <span className="mt-1 block text-xs font-semibold tracking-wide text-header-muted uppercase">
                  Wrongful Convictions. Exposed.
                </span>
              </Link>

              <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {FOOTER_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs font-bold tracking-widest text-header-muted uppercase transition hover:text-header-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {(settings?.facebookUrl || settings?.instagramUrl) && (
              <div className="sm:text-right">
                <p className="text-xs font-bold tracking-widest text-header-muted uppercase">
                  Follow Xonorate
                </p>
                <div className="mt-2 flex gap-3 sm:justify-end">
                  {settings.instagramUrl && (
                    <a
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Xonorate on Instagram"
                      className="text-header-muted transition hover:text-header-foreground"
                    >
                      <InstagramIcon className="h-[18px] w-[18px]" />
                    </a>
                  )}
                  {settings.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Xonorate on Facebook"
                      className="text-header-muted transition hover:text-header-foreground"
                    >
                      <FacebookIcon className="h-[18px] w-[18px]" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 border-t border-header-border pt-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-xs text-header-muted">© {year} XONORATE</p>
              <p className="text-xs text-header-muted">Xonorate Media Platform</p>
            </div>
            <p className="mt-2 text-xs text-header-muted">
              Privacy · Terms · Accessibility
            </p>
            <p className="mt-3 max-w-2xl text-xs text-header-muted">
              Xonorate does not adjudicate guilt or innocence — that
              evaluation belongs to the attorneys and innocence organizations
              we work with, based on the evidence in each case. No claim of
              innocence made here is a guarantee.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
