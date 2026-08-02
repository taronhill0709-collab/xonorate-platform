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
          The right to remain silent and the right to an attorney apply from
          the first interaction with police — not just at trial or after an
          arrest. Asking for a lawyer before answering any questions is not
          an admission of guilt, and it is the single most protective step
          available in the moment. Once you&apos;ve asked for a lawyer,
          police are required to stop questioning until one is present.
        </p>
        <p>
          A high percentage of documented wrongful convictions involve a
          false confession or a guilty plea entered under pressure —
          often from a suspect who believed cooperating, or pleading to a
          lesser charge, was the fastest way out of a frightening situation.
          It rarely is. Never waive the right to counsel to &quot;just
          explain what happened.&quot;
        </p>
        <p>
          Post-conviction, every state has different — and often short —
          deadlines for direct appeals, new-evidence motions, and
          post-conviction DNA testing requests. Missing a deadline can close
          off relief permanently, so contacting a public defender&apos;s
          office or an innocence organization (below) as early as possible
          matters even if a case feels hopeless.
        </p>
      </>
    ),
  },
  {
    id: "for-families",
    title: "For Families",
    body: (
      <>
        <p>
          A wrongful conviction doesn&apos;t only happen to the person
          convicted — it reshapes the lives of everyone around them: spouses
          who become sole earners overnight, children who grow up with a
          parent behind bars for a crime they didn&apos;t commit, and
          communities that lose someone they knew wasn&apos;t capable of
          what they were accused of. That toll rarely shows up in court
          records, which is part of why we ask about it directly for every
          case we document.
        </p>
        <p>
          The{" "}
          <a
            href="https://nrccfi.camden.rutgers.edu/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            National Resource Center on Children &amp; Families of the
            Incarcerated
          </a>{" "}
          (Rutgers University) publishes practical guidance on maintaining
          contact during incarceration, talking to children about a
          parent&apos;s imprisonment, and finding local family-support
          programs — regardless of whether the conviction is being
          contested.
        </p>
        <p>
          Staying involved in a case is also concrete work: keeping copies
          of every filing and court date, writing down what you remember
          about the original investigation while it&apos;s fresh, and
          maintaining contact with whoever is handling the appeal. Innocence
          organizations and public defenders can only act as fast as they
          get accurate information from the people closest to a case.
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
          — an association of more than 65 member organizations across the
          U.S. and abroad — connect people with regional organizations that
          investigate innocence claims and pursue exoneration case by case,
          usually at no cost to the client. The Network&apos;s site has a
          map for finding the member organization that covers a specific
          state.
        </p>
        <p>
          <a
            href="https://centurion.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Centurion
          </a>{" "}
          (formerly Centurion Ministries), founded in 1983, was the first
          organization in the country dedicated to investigating wrongful
          conviction cases and has helped free dozens of people serving life
          or death sentences.{" "}
          <a
            href="https://eji.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Equal Justice Initiative
          </a>{" "}
          provides legal representation to people who may have been wrongly
          convicted or denied a fair trial, with a particular focus on the
          South.
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
          (University of Michigan Law School) tracks every documented
          exoneration in the U.S. since 1989 — case details, contributing
          factors, time served — and is the source for the exoneration
          statistics cited across this site.
        </p>
      </>
    ),
  },
  {
    id: "legal-resources",
    title: "Legal Resources",
    body: (
      <>
        <p>
          Every state has a public defender or indigent-defense system for
          people who can&apos;t afford an attorney. The{" "}
          <a
            href="https://www.americanbar.org/groups/legal_services/flh-home/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            American Bar Association&apos;s Find Legal Help
          </a>{" "}
          service and most state bar associations run a lawyer-referral
          directory for locating post-conviction and appellate counsel.
        </p>
        <p>
          The{" "}
          <a
            href="https://www.nacdl.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            National Association of Criminal Defense Lawyers
          </a>{" "}
          maintains resources on defense strategy and appellate practice,
          including a dedicated{" "}
          <a
            href="https://www.nacdl.org/Landing/EyewitnessID"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            eyewitness identification
          </a>{" "}
          resource hub — one of the leading contributing factors in wrongful
          convictions. The{" "}
          <a
            href="https://www.nlada.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            National Legal Aid &amp; Defender Association
          </a>{" "}
          works to expand access to public defense nationally and can point
          to state-level resources. State innocence organizations (above)
          typically maintain their own intake process for reviewing a
          case&apos;s eligibility for their help.
        </p>
      </>
    ),
  },
  {
    id: "justice-reform",
    title: "Justice Reform",
    body: (
      <>
        <p>
          Wrongful convictions recur because of identifiable, fixable
          failures. The evidence points to a consistent set of causes across
          thousands of documented cases:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Eyewitness misidentification — the leading contributing factor
            in DNA-exoneration cases, worsened by suggestive lineup and
            photo-array procedures.
          </li>
          <li>
            Forensic science that was never scientifically validated (bite
            marks, hair microscopy, arson indicators long since discredited)
            but was presented to juries as certain.
          </li>
          <li>
            False confessions, often from minors, people with cognitive
            disabilities, or anyone worn down by long interrogations without
            counsel present.
          </li>
          <li>
            Jailhouse informant and incentivized-witness testimony, given in
            exchange for reduced charges or other benefits the jury is
            never told about.
          </li>
          <li>
            Official misconduct — withheld exculpatory evidence
            (a <em>Brady</em> violation), coached witnesses, or an
            investigation that stopped once a suspect was in hand.
          </li>
        </ul>
        <p>
          Concrete reforms exist for each of these: sequential,
          double-blind eyewitness identification procedures; mandatory
          recording of interrogations; independent forensic oversight;
          restrictions on uncorroborated informant testimony; and
          conviction integrity units empowered to reopen questionable
          cases. The{" "}
          <a
            href="https://www.ncsl.org/civil-and-criminal-justice"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            National Conference of State Legislatures
          </a>{" "}
          tracks which states have passed which reforms, and{" "}
          <a
            href="https://www.sentencingproject.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            The Sentencing Project
          </a>{" "}
          publishes research on sentencing and broader criminal justice
          policy. Contacting state legislators about these specific reforms
          — by name, not in the abstract — is one of the most direct ways an
          individual can reduce future wrongful convictions.
        </p>
      </>
    ),
  },
  {
    id: "support-services",
    title: "Support Services",
    body: (
      <>
        <p>
          Exoneration doesn&apos;t automatically come with support for
          rebuilding a life. As of now, most — but not all — states have a
          compensation statute for the wrongly convicted, and the amount,
          eligibility rules, and whether time is even a factor vary
          enormously by jurisdiction; a small number of states offer no
          compensation at all. The Innocence Project maintains an
          up-to-date, state-by-state compensation law guide on its site
          (linked above), since these rules change as legislatures act.
        </p>
        <p>
          Reentry needs — housing, employment, healthcare, restoring a
          driver&apos;s license or professional credentials, and processing
          the psychological toll of wrongful incarceration — are usually
          best coordinated through the innocence organization or legal team
          that handled the exoneration, since they know the specific
          jurisdiction&apos;s programs and can make direct referrals rather
          than a general search turning one up.
        </p>
      </>
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
