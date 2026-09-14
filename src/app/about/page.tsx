import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getFounderCase } from "@/lib/founder";

export const metadata = {
  title: "About",
  description:
    "Xonorate advocates for the wrongfully convicted — documenting cases, running petitions, and reporting on the scale of wrongful conviction in the U.S.",
};

// Pulls the founder's case (photo, slug) live so it never drifts from
// what's on his actual case page.
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const founderCase = await getFounderCase();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <Eyebrow text="About" />
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">
              About Xonorate
            </h1>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl px-6 py-14">
        <p className="text-lg text-foreground">
          Xonorate exists because a conviction isn&apos;t the end of the
          story for the people it gets wrong. We document individual cases
          in detail — the evidence, the record, the people behind it — and
          give the families and communities affected by wrongful conviction
          a way to be heard.
        </p>
        <p className="mt-4 text-muted">
          More than 3,850 people have been exonerated in the U.S. since
          1989, collectively losing over 36,000 years to wrongful
          imprisonment — and that number only counts the cases that were
          eventually overturned. Every one of those numbers is a person, a
          family, and a community that had to live with it in the meantime:
          a spouse who becomes the sole earner overnight, children who grow
          up with a parent behind bars for something they didn&apos;t do, a
          neighborhood that loses someone it knew wasn&apos;t capable of
          what they were accused of. That cost rarely shows up in a court
          record, which is exactly why we ask about it directly for every
          case we take on.
        </p>
        <p className="mt-4 text-muted">
          A public case page and an active petition put pressure where the
          legal process alone often can&apos;t: on the officials,
          prosecutors, and boards who have the power to act but no public
          incentive to move quickly. Cases can sit for years without
          attention. Our job is to make sure they don&apos;t sit quietly.
        </p>

        {founderCase && (
          <div className="mt-10 flex flex-col items-center gap-5 border border-brand/30 bg-brand-light/40 p-6 text-center sm:flex-row sm:text-left">
            {founderCase.photoUrl ? (
              <Image
                src={founderCase.photoUrl}
                alt={founderCase.clientName}
                width={112}
                height={112}
                className="h-24 w-24 shrink-0 object-cover ring-4 ring-brand/40"
                unoptimized
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-muted-background ring-4 ring-brand/40">
                <span className="font-serif text-2xl text-muted">
                  {founderCase.clientName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-header-muted uppercase">
                <ShieldCheck size={14} className="text-brand" />
                Our founder
              </p>
              <p className="mt-2 text-muted">
                {founderCase.clientName}{" "}
                founded Xonorate after spending 16
                years in a New Jersey prison for a double homicide he didn&apos;t
                commit — exonerated in 2021 when the state&apos;s Conviction
                Review Unit found he never should have been convicted. This
                platform exists because he knows firsthand how long a wrongful
                conviction can sit unattended, and what it takes to get one
                looked at again.
              </p>
              <Link
                href={`/cases/${founderCase.slug}`}
                className="mt-3 inline-block text-sm font-bold tracking-wide text-brand uppercase hover:underline"
              >
                Read his case
              </Link>
            </div>
          </div>
        )}

        <Eyebrow as="h2" text="What we do" className="mt-12" />
        <ul className="mt-4 space-y-3 text-muted">
          <li>
            <span className="font-semibold text-foreground">
              Document cases —
            </span>{" "}
            we build a public record for each client: the conviction, the
            evidence of innocence, and — where it exists — the path to
            exoneration.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Run petitions —
            </span>{" "}
            live campaigns addressed to the specific officials and bodies
            who have the power to act on a case, not a generic audience.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Report the news —
            </span>{" "}
            daily coverage of wrongful-conviction cases, policy, and reform
            efforts nationwide, to keep the scale of the problem visible
            beyond the cases we represent directly.
          </li>
        </ul>

        <Eyebrow as="h2" text="How we work with attorneys" className="mt-12" />
        <p className="mt-4 text-muted">
          When a client already has legal representation, we build the
          public case page directly from the record the legal team has
          established — the case overview, the evidence of innocence, and
          the specific due-process or forensic failures at issue. Nothing
          on a public page goes further than what the attorney of record
          has already documented; our role is to translate that case file
          into something the public can read and act on, not to add claims
          of our own. Attorneys and legal teams with a case they&apos;d
          like documented can reach out through the inquiry form below.
        </p>

        <Eyebrow as="h2" text="How we work with families and organizations" className="mt-12" />
        <p className="mt-4 text-muted">
          Not every case comes to us with an attorney already attached —
          sometimes a family is pursuing a case on their own, between
          counsel, or still looking for representation. In those
          situations, we work directly with the family to document what&apos;s
          known: the facts of the conviction, and the toll it&apos;s taken
          on the people closest to it. We also point families toward the
          established{" "}
          <Link href="/resources/browse?category=legal" className="text-link underline hover:text-link-strong">
            innocence organizations and legal resources
          </Link>{" "}
          already doing casework in their state, since that legal
          investigation is specialized work we don&apos;t duplicate.
        </p>
        <p className="mt-4 text-muted">
          Xonorate is a media and advocacy platform, not a law firm or a
          substitute for one — we don&apos;t provide legal representation.
          What we add is public documentation, a petition aimed at the
          people who can act, and ongoing coverage, alongside — not in
          place of — the legal work being done by attorneys and innocence
          organizations on a case.
        </p>

        <Eyebrow as="h2" text="Have a case to share?" className="mt-12" />
        <p className="mt-4 text-muted">
          Whether you&apos;re an attorney with a client&apos;s case file
          ready to go, or a family member navigating this without one yet,
          our team reviews every submission privately.
        </p>
        <Link
          href="/submit-case"
          className="mt-4 inline-block bg-brand px-5 py-2.5 text-xs font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent"
        >
          Submit a case
        </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
