import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { NewsletterForm } from "@/components/newsletter-form";

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

const MENU_LINKS = [
  { href: "/cases", label: "Cases" },
  { href: "/petitions", label: "Petitions" },
  { href: "/posts", label: "News" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

const GET_INVOLVED_LINKS = [
  { href: "/submit-inquiry", label: "Submit an inquiry" },
  { href: "/login", label: "Sign in" },
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
    <footer className="border-t border-header-border bg-header-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start gap-3 border-b border-header-border pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-lg text-header-foreground">
              Stay informed. Stay involved.
            </p>
            <p className="mt-1 text-sm text-header-muted">
              Get the latest updates on cases, petitions, and justice reform.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-2 gap-8 pt-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/xonorate-mark.svg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-display text-lg font-semibold tracking-[0.08em] text-header-foreground">
                XONORATE
              </span>
            </Link>
            <p className="mt-2 text-sm text-header-muted">
              Giving the innocent a voice.
            </p>
            {(settings?.facebookUrl || settings?.instagramUrl) && (
              <div className="mt-4 flex gap-3">
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
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-header-foreground uppercase">
              Menu
            </p>
            <ul className="mt-3 space-y-2">
              {MENU_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-header-muted transition hover:text-header-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-header-foreground uppercase">
              Get Involved
            </p>
            <ul className="mt-3 space-y-2">
              {GET_INVOLVED_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-header-muted transition hover:text-header-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-header-border pt-6 text-xs text-header-muted">
          © {year} Xonorate Media Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
