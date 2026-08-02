import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "About",
  description:
    "Xonorate advocates for the wrongfully convicted — documenting cases, running petitions, and reporting on the scale of wrongful conviction in the U.S.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="font-serif text-3xl text-foreground">About Xonorate</h1>
        <p className="mt-4 text-muted">
          Xonorate exists because a conviction isn&apos;t the end of the
          story for the people it gets wrong. We document individual cases
          in detail — the evidence, the record, the people behind it — and
          give the families and communities affected by wrongful conviction
          a way to be heard.
        </p>
        <p className="mt-4 text-muted">
          More than 3,600 people have been exonerated in the U.S. since
          1989, collectively losing over 27,000 years to wrongful
          imprisonment. Every one of those numbers is a person, a family,
          and a community that had to live with it. That&apos;s what we
          report on, case by case.
        </p>

        <h2 className="mt-10 font-serif text-xl text-foreground">
          What we do
        </h2>
        <ul className="mt-4 space-y-3 text-muted">
          <li>
            <span className="font-medium text-foreground">
              Document cases —
            </span>{" "}
            we build a public record for each client: the conviction, the
            evidence, and — where it exists — the path to exoneration.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Run petitions —
            </span>{" "}
            live campaigns aimed at the specific officials and bodies who
            can act on a case.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Report the news —
            </span>{" "}
            daily coverage of wrongful-conviction cases, policy, and reform
            efforts nationwide.
          </li>
        </ul>

        <h2 className="mt-10 font-serif text-xl text-foreground">
          Have a case to share?
        </h2>
        <p className="mt-4 text-muted">
          If you believe you or a loved one was wrongfully convicted, our
          team reviews every submission privately.
        </p>
        <Link
          href="/submit-inquiry"
          className="mt-4 inline-block rounded-md bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition hover:opacity-90"
        >
          Submit an inquiry
        </Link>
      </main>
    </>
  );
}
