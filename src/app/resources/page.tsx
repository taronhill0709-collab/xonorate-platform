import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Resources",
  description:
    "Resources for people navigating a wrongful conviction, their families, and anyone who wants to understand or push for reform.",
};

function ResourceCard({
  name,
  description,
  href,
  meta,
  tone = "default",
}: {
  name: string;
  description: string;
  href: string;
  meta?: string;
  tone?: "default" | "crisis";
}) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={
        tone === "crisis"
          ? "block rounded-lg border border-accent bg-accent/10 p-5 shadow-sm transition hover:shadow-md"
          : "block rounded-lg border border-border p-5 shadow-sm transition hover:border-brand hover:shadow-md"
      }
    >
      <p className="font-serif text-lg text-foreground">{name}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <p
        className={
          tone === "crisis"
            ? "mt-2 text-xs font-semibold uppercase tracking-wide text-accent"
            : "mt-2 text-xs font-medium uppercase tracking-wide text-brand"
        }
      >
        {meta ?? href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </p>
    </a>
  );
}

const SECTIONS = [
  {
    id: "know-your-rights",
    title: "Know Your Rights",
    body: (
      <>
        <p>
          A large share of documented wrongful convictions trace back to what
          happened in the first few minutes of a police encounter — before a
          lawyer was ever in the room. These rights apply to everyone in the
          United States, in every state, regardless of immigration or
          citizenship status.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">
              You have the right to remain silent, and the right to an
              attorney.
            </strong>{" "}
            Say it out loud — clearly and calmly: &quot;I am going to remain
            silent. I want a lawyer.&quot; Once you&apos;ve invoked these
            rights, officers are required to stop questioning until counsel
            is present. Simply staying quiet is not always enough; stating
            it removes any ambiguity.
          </li>
          <li>
            <strong className="text-foreground">
              You can refuse a search of your person, car, or home.
            </strong>{" "}
            Without a warrant, your consent, or an emergency the law
            recognizes, officers generally cannot search you or your
            property. Say &quot;I do not consent to a search&quot; clearly —
            you can say this even if they search anyway; it preserves the
            issue for later. Do not physically resist.
          </li>
          <li>
            <strong className="text-foreground">
              If you&apos;re not under arrest, you can ask &quot;Am I free to
              leave?&quot;
            </strong>{" "}
            If the answer is yes, you may calmly walk away. If the answer is
            no, you are being detained or arrested, and the rights above
            still apply.
          </li>
          <li>
            <strong className="text-foreground">
              You have the right to record police in public.
            </strong>{" "}
            Recording officers performing their duties in a public place is
            constitutionally protected in every state, as long as you
            don&apos;t physically interfere with their activity.
          </li>
          <li>
            <strong className="text-foreground">
              These rights do not depend on immigration or citizenship
              status.
            </strong>{" "}
            Everyone physically present in the U.S. — citizen or not — has
            the right to remain silent and the right to refuse to sign
            anything without speaking to a lawyer first.
          </li>
        </ul>

        <ResourceCard
          name="ACLU — Know Your Rights"
          description="The national hub covering police encounters, protests, immigration status, and more — and the place to start for finding your state ACLU affiliate's own guidance."
          href="https://www.aclu.org/know-your-rights"
        />

        <p className="text-sm">
          Many state ACLU affiliates publish free, printable, foldable
          &quot;Know Your Rights&quot; cards in multiple languages sized to
          keep in a wallet. The national hub above routes to each state
          affiliate&apos;s version — start there rather than searching for a
          specific state&apos;s card directly.
        </p>

        <p className="rounded-md border border-border bg-muted-background p-4 text-sm text-muted">
          This section is general public education, not legal advice, and it
          is not a substitute for talking to a lawyer about a specific
          situation. If you or someone you know is currently involved in a
          police encounter or facing charges, contact an attorney or a
          public defender&apos;s office as soon as possible.
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
            href="https://innocencenetwork.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Innocence Network
          </a>{" "}
          is the single best starting point: an association of more than 65
          member organizations across the U.S. and abroad that investigate
          innocence claims and pursue exoneration case by case, usually at
          no cost to the client. Its member map routes you directly to the
          organization that covers a specific state.
        </p>

        <ResourceCard
          name="Innocence Network — Find a Member Organization"
          description="Directory of 65+ regional innocence organizations. Start here to find the group that covers the state where the conviction happened."
          href="https://innocencenetwork.org/network-members/"
        />

        <div className="rounded-md border border-border p-4">
          <p className="text-sm font-medium text-foreground">
            Do you qualify for help from an innocence organization?
          </p>
          <p className="mt-2 text-sm text-muted">
            Intake criteria differ by organization, but most Innocence
            Network members generally look for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>
              A claim of <em>actual</em> innocence — not just a procedural or
              sentencing error in an otherwise valid conviction.
            </li>
            <li>
              A completed conviction. Most organizations don&apos;t take
              cases that are still pretrial or on direct appeal with a public
              defender already assigned.
            </li>
            <li>
              Some avenue of case-specific evidence left to investigate —
              untested DNA, forensic re-analysis, a recanting witness, or
              newly discovered evidence — since these organizations
              investigate, not just advocate.
            </li>
            <li>
              Because caseloads are large and resources limited, cases with
              more time remaining on the sentence are often prioritized,
              though this varies by organization.
            </li>
          </ul>
          <p className="mt-2 text-sm text-muted">
            Every member organization has its own intake form on its
            website, reached through the Innocence Network directory above.
          </p>
        </div>

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
        <p className="text-sm text-muted">
          If a case doesn&apos;t fit an innocence organization&apos;s intake
          criteria, or needs representation for something other than an
          innocence claim, see{" "}
          <a href="#legal-resources" className="text-brand underline">
            Legal Resources
          </a>{" "}
          below for public defender and lawyer-referral options.
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
          people who can&apos;t afford an attorney, and most state bar
          associations run a lawyer-referral directory. Search &quot;[state]
          bar association lawyer referral service&quot; to find the one for
          a specific state, or start with a post-conviction unit inside the
          state public defender&apos;s office where one exists.
        </p>

        <ResourceCard
          name="Restoration of Rights Project"
          description="Collateral Consequences Resource Center's free, state-by-state guide to expungement, record sealing, pardons, and restoring professional licenses after a conviction — the best resource for 'how do I get my license back.'"
          href="https://ccresourcecenter.org/"
        />

        <ResourceCard
          name="National Association of Criminal Defense Lawyers (NACDL)"
          description="Attorney referrals and post-conviction resources, including a dedicated eyewitness identification hub — one of the leading contributing factors in wrongful convictions."
          href="https://www.nacdl.org/"
        />

        <ResourceCard
          name="National Registry of Exonerations"
          description="Research database tracking exonerations nationwide, including a state-by-state guide to wrongful-conviction compensation laws — use it to see what compensation, if any, a given state provides."
          href="https://www.law.umich.edu/special/exoneration/Pages/about.aspx"
        />

        <ResourceCard
          name="ABA Find Legal Help"
          description="The American Bar Association's directory for locating legal aid and lawyer-referral services by state."
          href="https://www.americanbar.org/groups/legal_services/flh-home/"
        />

        <ResourceCard
          name="National Legal Aid & Defender Association (NLADA)"
          description="Works to expand access to public defense nationally and can point to state-level public defender and legal aid resources."
          href="https://www.nlada.org/"
        />

        <p className="text-sm text-muted">
          State public defender post-conviction units and state bar
          lawyer-referral services vary widely — there&apos;s no single
          national directory, so the fastest path is usually searching
          &quot;[state] bar association lawyer referral service&quot; or
          &quot;[state] public defender post-conviction unit&quot; directly.
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
          failures — eyewitness misidentification, unvalidated forensic
          science, false confessions, informant testimony, and official
          misconduct chief among them. For anyone who wants to work on the
          system itself rather than an individual case, these organizations
          lead on research, litigation, and policy:
        </p>

        <ResourceCard
          name="The Sentencing Project"
          description="Research and advocacy on sentencing policy and state-level incarceration data."
          href="https://www.sentencingproject.org/"
        />
        <ResourceCard
          name="Prison Policy Initiative"
          description="Independent research exposing the scale and harms of mass incarceration nationwide."
          href="https://www.prisonpolicy.org/"
        />
        <ResourceCard
          name="Brennan Center for Justice"
          description="Legal and policy work on prosecutorial accountability and systemic criminal justice reform."
          href="https://www.brennancenter.org/"
        />
        <ResourceCard
          name="Equal Justice Initiative"
          description="Litigation and advocacy on prosecutorial and police misconduct, unreliable forensic evidence, and indigent defense."
          href="https://eji.org/"
        />
        <ResourceCard
          name="ACLU Campaign for Smart Justice"
          description="Focused campaign work on prosecutorial accountability and district attorney elections."
          href="https://www.aclu.org/issues/smart-justice"
        />
        <ResourceCard
          name="The Marshall Project"
          description="Nonprofit journalism covering the criminal justice system in depth."
          href="https://www.themarshallproject.org/"
        />

        <p className="text-sm text-muted">
          Contacting state legislators about specific reforms — by name, not
          in the abstract — remains one of the most direct ways an
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
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          In crisis right now?
        </p>
        <ResourceCard
          tone="crisis"
          name="988 Suicide & Crisis Lifeline"
          description="Free and confidential support for anyone in crisis, available around the clock."
          href="https://988lifeline.org/"
          meta="Call or text 988 — 24/7"
        />

        <p className="mt-6 font-serif text-lg text-foreground">
          Mental health &amp; trauma
        </p>
        <ResourceCard
          name="SAMHSA National Helpline"
          description="Free, confidential treatment referral and information service for mental health and substance use, 24/7."
          href="https://www.samhsa.gov/find-help/national-helpline"
          meta="1-800-662-4357 · 24/7"
        />
        <ResourceCard
          name="Healing Justice"
          description="Restorative justice and trauma-informed support built specifically for exonerees and their families."
          href="https://healingjustice.org/"
        />

        <p className="mt-6 font-serif text-lg text-foreground">
          Reentry, housing &amp; employment
        </p>
        <ResourceCard
          name="211"
          description="The national helpline connecting anyone to local housing, food, healthcare, and financial assistance by zip code — the best single starting point if you don't know where to look locally."
          href="https://www.211.org/"
          meta="Call 211 or visit 211.org"
        />
        <ResourceCard
          name="After Innocence"
          description="Case management connecting exonerees to healthcare, benefits, social services, and legal assistance during reentry."
          href="https://after-innocence.org/"
        />
        <ResourceCard
          name="National Reentry Resource Center"
          description="Directories of housing and employment reentry programs, run by the Council of State Governments Justice Center."
          href="https://csgjusticecenter.org/"
        />

        <p className="mt-6 font-serif text-lg text-foreground">
          Restoring licenses &amp; credentials
        </p>
        <ResourceCard
          name="Restoration of Rights Project"
          description="The same free, state-by-state guide referenced under Legal Resources — restoring a professional license or occupational credential after a conviction is as much a support-services need as a legal one."
          href="https://ccresourcecenter.org/"
        />

        <p className="mt-6 font-serif text-lg text-foreground">
          Death row exonerees
        </p>
        <ResourceCard
          name="Witness to Innocence"
          description="Peer support and public advocacy run by exonerees themselves, including former death row survivors."
          href="https://www.witnesstoinnocence.org/"
        />

        <p className="mt-2 text-sm text-muted">
          Compensation for the wrongly convicted is not automatic. Most, but
          not all, states have a compensation statute, and the amount,
          eligibility rules, and whether time served is even a factor vary
          enormously by jurisdiction — see the National Registry of
          Exonerations link under Legal Resources above for a state-by-state
          breakdown.
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

        <p className="mt-16 border-t border-border pt-6 text-sm text-muted">
          This page provides general guidance on where to seek help. It is
          not legal or medical advice, and it isn&apos;t a substitute for
          consulting a licensed attorney or medical professional about a
          specific situation.
        </p>
      </main>
    </>
  );
}
