import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Resources",
  description:
    "Resources for people navigating a wrongful conviction, their families, and anyone who wants to understand or push for reform.",
};

const SECTIONS = [
  {
    id: "know-your-rights",
    title: "Know Your Rights",
    body: (
      <>
        <p>
          If you or someone you know is under investigation or has been
          charged, the right to remain silent and the right to an attorney
          apply from the first interaction with police — not just at trial.
          Requesting a lawyer before answering questions is not an admission
          of guilt, and it is the single most protective step available in
          the moment.
        </p>
        <p>
          Post-conviction, every state has different rules and deadlines for
          appeals, new-evidence motions, and DNA testing requests. An
          innocence organization (below) or a public defender&apos;s office is
          the fastest way to find out what applies in a specific case.
        </p>
      </>
    ),
  },
  {
    id: "innocence-organizations",
    title: "Innocence Organizations",
    body: (
      <>
        <p>
          The{" "}
          <a
            href="https://innocenceproject.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Innocence Project
          </a>{" "}
          and the{" "}
          <a
            href="https://innocencenetwork.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Innocence Network
          </a>{" "}
          connect people with regional organizations that investigate
          innocence claims and pursue exoneration case by case, usually at
          no cost to the client.
        </p>
        <p>
          The{" "}
          <a
            href="https://www.law.umich.edu/special/exoneration"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            National Registry of Exonerations
          </a>{" "}
          tracks every documented exoneration in the U.S. since 1989 and is
          the source for the exoneration statistics cited across this site.
        </p>
      </>
    ),
  },
  {
    id: "legal-resources",
    title: "Legal Resources",
    body: (
      <p>
        Every state has a public defender or indigent-defense system for
        people who can&apos;t afford an attorney, and most state bar
        associations run a lawyer-referral service for finding
        post-conviction and appellate counsel. State innocence
        organizations (listed above) typically maintain their own intake
        process for reviewing a case&apos;s eligibility for their help.
      </p>
    ),
  },
  {
    id: "justice-reform",
    title: "Justice Reform",
    body: (
      <p>
        Wrongful convictions recur because of identifiable, fixable
        failures — eyewitness misidentification procedures, forensic
        science that hasn&apos;t been validated, and reliance on informant
        testimony among them. Contacting state legislators about
        eyewitness-identification reform, recording-of-interrogations
        requirements, and post-conviction DNA access laws is one of the
        most direct ways to reduce future wrongful convictions.
      </p>
    ),
  },
  {
    id: "support-services",
    title: "Support Services",
    body: (
      <p>
        Exoneration doesn&apos;t automatically come with support for
        rebuilding a life — housing, employment, healthcare, and
        compensation laws vary enormously by state. Innocence organizations
        (above) are usually the best starting point for reentry and
        compensation-claim support, since eligibility rules differ by
        jurisdiction.
      </p>
    ),
  },
] as const;

export default function ResourcesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">Resources</h1>
        <p className="mt-4 text-muted">
          For people navigating a wrongful conviction, their families, and
          anyone who wants to understand — or push for reform of — the
          system that makes wrongful conviction possible.
        </p>

        <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-y border-border py-4 text-sm">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-brand underline">
              {s.title}
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-12">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20">
              <h2 className="font-serif text-xl text-foreground">
                {s.title}
              </h2>
              <div className="mt-3 space-y-3 text-muted">{s.body}</div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
