import { Badge } from "@/app/admin/_components/field";

// A living reference for future admins — start with "Create With This"
// (the classification an editor has to make on every discovered story) and
// add more topics here as sections grow (Investigation Builder workflow,
// Source Library, editorial signal meanings, etc.). Static content, no DB.

const DECISION_STEPS = [
  { q: "Is this actually about one of your own cases?", a: "Case Development" },
  { q: "Is the source itself the useful thing — an org, a report, a database?", a: "Resource" },
  { q: "Is nothing resolved yet — a hearing or ruling still pending?", a: "Watch" },
  { q: "Do you want to teach the underlying mechanism, not argue about this incident?", a: "Explainer" },
  { q: "Do you want to argue this specific thing is serious and shouldn't be ignored?", a: "Xonorate Analysis" },
  { q: "Are you planning to actually go dig — records, interviews, cross-case comparison?", a: "Start Investigation" },
  { q: "None of the above?", a: "News Brief" },
] as const;

type Classification = {
  name: string;
  tag: string;
  tone: "brand" | "neutral" | "danger";
  definition: string;
  useWhen: string;
  example?: string;
};

const CLASSIFICATIONS: Classification[] = [
  {
    name: "News Brief",
    tag: "Default",
    tone: "neutral",
    definition:
      "A short, factual restating of the source. No original reporting, no argument — just telling readers what happened.",
    useWhen:
      "Worth telling readers about, but doesn't need Xonorate's own take. Most \"Important\" or \"Routine\" signal items land here.",
  },
  {
    name: "Case Development",
    tag: "Client-linked",
    tone: "neutral",
    definition: "A short update tied to one of Xonorate's own cases — a hearing, a ruling, a filing.",
    useWhen: "The AI suggested a matching case, or you can see the story concerns a client directly.",
    example:
      "A \"Broadview 6\" grand-jury misconduct ruling — Case Development if it turns out to touch a client's own prosecution.",
  },
  {
    name: "Xonorate Analysis",
    tag: "Grounded in research",
    tone: "brand",
    definition:
      "Original context and explanation — why it matters, how it connects to a pattern, an argument in Xonorate's own voice. Runs a background web search for real supporting data before drafting.",
    useWhen: "One incident is a symptom of something bigger, and you want to make the case that it's serious.",
    example:
      "23 misconduct findings in one Colorado DA's office → drafted analysis connecting it to the office's prior disbarment and to national misconduct data (NRE: misconduct present in 79% of homicide exonerations).",
  },
  {
    name: "Explainer",
    tag: "Grounded in research",
    tone: "brand",
    definition: "Educational — how or why a type of error happens in general, using the story only as the occasion for it.",
    useWhen: "The story is a good hook for something evergreen, independent of how this particular case resolves.",
    example:
      "A misidentification ruling becomes the occasion for \"how eyewitness misidentification actually happens\" — cross-racial ID, suggestive lineups, weapon focus.",
  },
  {
    name: "Watch",
    tag: "Unresolved",
    tone: "neutral",
    definition: "A flag: Xonorate is following this, here's what to expect next.",
    useWhen: "Nothing has resolved — the real story is in the follow-up, not today's development.",
  },
  {
    name: "Resource",
    tag: "Pointer",
    tone: "neutral",
    definition: "Points readers to something useful — an organization, a report, a legal-aid tool.",
    useWhen: "The source is the useful thing, not really \"news\" at all.",
  },
  {
    name: "Start Investigation",
    tag: "Not a post",
    tone: "danger",
    definition:
      "Creates a real Investigation — its own record with a thesis, timeline, evidence, and a production status from Idea through Published. Reserved for actual original reporting.",
    useWhen: "You intend to go dig: records requests, interviews, comparing cases — not just write about the one article.",
  },
];

export default function AdminHelpPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs font-bold tracking-widest text-brand uppercase">Help &amp; Guide</p>
      <h1 className="mt-1 font-serif text-2xl text-foreground">Create With This</h1>
      <p className="mt-1 text-sm text-muted">
        Every discovered story earns a classification, not a publication. This is how to pick the
        right one — fast, and without inflating routine news into something it isn&apos;t.
      </p>

      <section className="mt-8">
        <h2 className="font-serif text-lg text-foreground">The fast read</h2>
        <p className="mt-1 text-sm text-muted">Work down this list in order. Stop at the first question you answer yes to.</p>
        <ol className="mt-4 divide-y divide-border border-y border-border">
          {DECISION_STEPS.map((step, i) => (
            <li key={step.q} className="flex items-baseline gap-3 py-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light font-mono text-xs font-bold text-brand">
                {i + 1}
              </span>
              <span className="flex-1 text-foreground">{step.q}</span>
              <span className="font-mono text-xs font-bold whitespace-nowrap text-muted">→ {step.a}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg text-foreground">The seven classifications</h2>
        <p className="mt-1 text-sm text-muted">What each one commits you to, and a real example from the pipeline.</p>

        <div className="mt-4 space-y-3">
          {CLASSIFICATIONS.map((c) => (
            <div key={c.name} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={c.tone}>{c.tag}</Badge>
                <h3 className="font-serif text-base text-foreground">{c.name}</h3>
              </div>
              <p className="mt-2 text-sm text-foreground">{c.definition}</p>
              <p className="mt-2 text-sm text-muted">
                <span className="font-medium text-foreground">Use when: </span>
                {c.useWhen}
              </p>
              {c.example && (
                <p className="mt-2 text-sm text-muted italic">
                  <span className="not-italic font-medium text-foreground">Example: </span>
                  {c.example}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 rounded-md border border-border border-l-4 border-l-brand bg-muted-background px-4 py-3">
        <p className="text-sm text-muted">
          The AI&apos;s &quot;Suggested&quot; badge on each Intelligence card is a starting guess from
          the enrichment step, not a decision. Always sanity-check it — you&apos;re free to override
          it every time.
        </p>
      </div>

      <p className="mt-10 border-t border-border pt-6 text-center font-serif text-base text-muted italic">
        Most discoveries should end as a <span className="font-medium text-brand not-italic">News Brief</span> or
        nothing at all. Analysis and Investigation stay rare — that scarcity is the credibility.
      </p>
    </div>
  );
}
