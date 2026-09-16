import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import type { IssueMechanismStep, IssueScenario, IssueSourceCitation, IssueStatistic } from "@/lib/issues";

// Presentational pieces for the deep Issues rewrite (2026) — kept separate
// from page.tsx the same way resources/[slug]/resource-sections.tsx keeps
// its page lean. Every section here is designed to be skipped cleanly when
// its data is undefined, so an issue that hasn't been rewritten yet still
// renders (just with fewer sections) rather than breaking.

const LABEL = "text-xs font-bold tracking-widest text-label uppercase";

/** "THE DATA" — one block per statistic, each carrying its own source,
 * dataset, population, and time period on its face. Never derived from
 * Xonorate's own case count. */
export function DataSection({
  statistics,
  dataNote,
}: {
  statistics: IssueStatistic[];
  dataNote: string;
}) {
  return (
    <section>
      <Eyebrow text="The data" />
      <div className="mt-6 space-y-6">
        {statistics.map((stat, i) => (
          <div key={i} className="border border-border p-6 sm:p-8">
            <p className="font-serif text-6xl text-brand tabular-nums">{stat.value}</p>
            <p className="mt-2 max-w-xl text-lg text-foreground">
              of <span className="font-semibold">{stat.dataset}</span>
              {" — "}
              <a
                href={stat.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link underline hover:text-link-strong"
              >
                {stat.sourceLabel}
              </a>
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 text-sm sm:grid-cols-3">
              <div>
                <dt className={LABEL}>Population</dt>
                <dd className="mt-1 text-foreground">{stat.population}</dd>
              </div>
              <div>
                <dt className={LABEL}>Time period</dt>
                <dd className="mt-1 text-foreground">{stat.timePeriod}</dd>
              </div>
              {stat.casesAnalyzed && (
                <div>
                  <dt className={LABEL}>Cases analyzed</dt>
                  <dd className="mt-1 text-foreground">{stat.casesAnalyzed}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6 border-t border-border pt-6">
              <p className={LABEL}>What the number means</p>
              <p className="mt-2 text-sm text-muted">{stat.whatItMeans}</p>
            </div>
          </div>
        ))}
      </div>
      {statistics.length > 1 && (
        <p className="mt-4 text-sm text-muted">
          These figures come from different populations, not a disagreement about the facts — see
          each statistic&apos;s own population and time period above for why they diverge.
        </p>
      )}
      <p className="mt-6 max-w-2xl text-xs text-muted italic">{dataNote}</p>
    </section>
  );
}

/** Legacy single-figure fallback for issues that haven't been rewritten
 * with the full `statistics` array yet — same figure the page has always
 * shown, now under the same "The data" heading for structural consistency. */
export function LegacyDataSection({
  stat,
  issueTitle,
  sourceUrl,
}: {
  stat: { value: string; label: string };
  issueTitle: string;
  sourceUrl: string;
}) {
  return (
    <section>
      <Eyebrow text="The data" />
      <div className="mt-6 border border-border p-6 sm:p-8">
        <p className="font-serif text-6xl text-brand tabular-nums">{stat.value}</p>
        <p className="mt-2 text-lg text-foreground">
          {stat.label} involved {issueTitle.toLowerCase()}
          {" — "}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link underline hover:text-link-strong"
          >
            Innocence Project
          </a>
        </p>
      </div>
    </section>
  );
}

export function WhatIsItSection({ explanation }: { explanation: string }) {
  return (
    <section className="mt-14">
      <Eyebrow text="What is it?" />
      <p className="mt-4 text-lg leading-relaxed text-foreground">{explanation}</p>
    </section>
  );
}

export function MechanismSection({ steps }: { steps: IssueMechanismStep[] }) {
  return (
    <section className="mt-14">
      <Eyebrow text="How does it happen?" />
      <ol className="mt-6 space-y-6">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="shrink-0 font-mono text-sm font-bold text-brand tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-serif text-lg text-foreground">{step.title}</p>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WhyItMattersSection({ body }: { body: string }) {
  return (
    <section className="mt-14">
      <Eyebrow text="Why can it matter?" />
      <p className="mt-4 text-base leading-relaxed text-foreground">{body}</p>
    </section>
  );
}

export function DistinctionsSection({ distinctions }: { distinctions: string[] }) {
  return (
    <section className="mt-10 space-y-3">
      {distinctions.map((text, i) => (
        <div key={i} className="border-l-4 border-brand bg-muted-background p-4">
          <p className={`${LABEL} mb-1`}>Important distinction</p>
          <p className="text-sm text-foreground">{text}</p>
        </div>
      ))}
    </section>
  );
}

function ScenarioStage({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className={LABEL}>{label}</p>
      <div className="mt-2 text-base leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

export function ScenarioSection({ scenario }: { scenario: IssueScenario }) {
  return (
    <section className="mt-14">
      <Eyebrow text="Illustrative scenario" />
      <div className="mt-4 border border-brand/60 bg-brand-light p-4">
        <p className="text-xs font-bold tracking-widest text-brand uppercase">
          Fictional example for educational purposes
        </p>
        <p className="mt-1 text-sm text-foreground">
          This is not a real Xonorate case. It illustrates how this issue can develop in a criminal
          case, generally.
        </p>
      </div>

      <ScenarioStage label="The incident">{scenario.incident}</ScenarioStage>
      <ScenarioStage label="The initial investigation">{scenario.initialInvestigation}</ScenarioStage>
      <ScenarioStage label="Where the problem begins">{scenario.whereProblemBegins}</ScenarioStage>
      <ScenarioStage label="How the investigation develops">
        {scenario.howInvestigationDevelops}
      </ScenarioStage>

      <div className="mt-8">
        <p className={LABEL}>How it snowballs</p>
        <div className="mt-3 border border-border p-5">
          {scenario.snowballChain.map((step, i) => (
            <div key={i}>
              <p className="font-mono text-sm text-foreground">{step}</p>
              {i < scenario.snowballChain.length - 1 && (
                <p className="py-1 text-center text-muted" aria-hidden>
                  ↓
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-base leading-relaxed text-foreground">{scenario.snowballNarrative}</p>
      </div>

      <div className="mt-8">
        <p className={LABEL}>The courtroom</p>
        <p className="mt-2 text-base leading-relaxed text-foreground">{scenario.courtroomNarrative}</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-border p-4">
            <p className="text-[11px] font-bold tracking-widest text-label uppercase">What the jury hears</p>
            <p className="mt-2 font-serif text-lg text-foreground">&ldquo;{scenario.whatJuryHears}&rdquo;</p>
          </div>
          <div className="border border-brand/60 bg-muted-background p-4">
            <p className="text-[11px] font-bold tracking-widest text-brand uppercase">
              What the underlying record may show
            </p>
            <p className="mt-2 font-serif text-lg text-foreground">&ldquo;{scenario.whatRecordShows}&rdquo;</p>
          </div>
        </div>
      </div>

      <ScenarioStage label="The conviction">{scenario.conviction}</ScenarioStage>
      <ScenarioStage label="Years later">{scenario.yearsLater}</ScenarioStage>

      <div className="mt-8">
        <p className={LABEL}>The breakdown</p>
        <dl className="mt-3 grid grid-cols-1 gap-4 border border-border p-5 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold tracking-widest text-brand uppercase">What happened</dt>
            <dd className="mt-1 text-sm text-foreground">{scenario.breakdown.whatHappened}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-widest text-brand uppercase">Why it mattered</dt>
            <dd className="mt-1 text-sm text-foreground">{scenario.breakdown.whyItMattered}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-widest text-brand uppercase">
              What should have been examined
            </dt>
            <dd className="mt-1 text-sm text-foreground">{scenario.breakdown.whatShouldHaveBeenExamined}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-widest text-brand uppercase">
              What safeguard could have helped
            </dt>
            <dd className="mt-1 text-sm text-foreground">{scenario.breakdown.whatSafeguardCouldHaveHelped}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 border-l-4 border-brand pl-5">
        <p className={LABEL}>The bigger lesson</p>
        <p className="mt-2 font-serif text-xl leading-snug text-foreground">{scenario.biggerLesson}</p>
      </div>
    </section>
  );
}

export type DocumentedCase = {
  id: string;
  clientName: string;
  slug: string;
  status: string;
  state: string;
  summary: string;
};

export function DocumentedCasesSection({
  cases,
  caseNotes,
  note,
  statusLabel,
}: {
  cases: DocumentedCase[];
  caseNotes?: Record<string, string>;
  note: string;
  statusLabel: (status: string) => string;
}) {
  if (cases.length === 0) return null;
  return (
    <section className="mt-14">
      <Eyebrow text="See it in documented cases" />
      <p className="mt-3 max-w-2xl text-sm text-muted">{note}</p>
      <div className="mt-6 space-y-5">
        {cases.map((c) => (
          <Link
            key={c.id}
            href={`/cases/${c.slug}`}
            className="group block border border-border p-5 transition hover:border-brand/50"
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-serif text-xl text-foreground group-hover:text-brand">{c.clientName}</p>
              <span className="font-mono text-xs font-bold tracking-wide text-label uppercase">{c.state}</span>
              <span className="ml-auto inline-block border border-brand/50 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-brand uppercase">
                {statusLabel(c.status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{caseNotes?.[c.slug] ?? c.summary}</p>
            <span className="mt-3 inline-block font-mono text-xs font-bold tracking-wide text-brand uppercase">
              Read the full case →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function BiggerPictureSection({ body }: { body: string }) {
  return (
    <section className="mt-14 border-t border-border pt-8">
      <Eyebrow text="The bigger picture" />
      <p className="mt-4 text-base leading-relaxed text-foreground">{body}</p>
    </section>
  );
}

export function SourcesSection({ sources }: { sources: IssueSourceCitation[] }) {
  return (
    <section className="mt-14 border-t border-border pt-8">
      <p className={LABEL}>Sources / research</p>
      <ul className="mt-4 space-y-3">
        {sources.map((s, i) => (
          <li key={i}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-base text-link hover:text-link-strong hover:underline"
            >
              {s.label} ↗
            </a>
            <p className="text-xs text-muted">
              {s.organization}
              {s.note ? ` — ${s.note}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
