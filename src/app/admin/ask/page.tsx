import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { askQuestions } from "@/db/schema";
import { db } from "@/db";
import { jurisdictionLabel } from "@/lib/jurisdictions";
import { deleteAskQuestion } from "./actions";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function AdminAskXonoratePage() {
  const [[totals], gapRows, flaggedRows, recentRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        answered: sql<number>`count(*) filter (where ${askQuestions.status} = 'answered')`,
        needsClarification: sql<number>`count(*) filter (where ${askQuestions.status} = 'needs_clarification')`,
        researchGap: sql<number>`count(*) filter (where ${askQuestions.status} = 'research_gap')`,
        flagged: sql<number>`count(*) filter (where ${askQuestions.flaggedForReview} = true)`,
      })
      .from(askQuestions),
    db.select().from(askQuestions).where(eq(askQuestions.status, "research_gap")).orderBy(desc(askQuestions.createdAt)).limit(25),
    db.select().from(askQuestions).where(eq(askQuestions.flaggedForReview, true)).orderBy(desc(askQuestions.createdAt)).limit(25),
    db.select().from(askQuestions).orderBy(desc(askQuestions.createdAt)).limit(25),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Ask Xonorate</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Quality and research-gap pipeline for the Ask Xonorate assistant. A research gap means the curated{" "}
        <Link href="/admin/knowledge-sources" className="text-brand underline">
          Knowledge Sources
        </Link>{" "}
        library didn&apos;t yet cover something a visitor asked — add a source for that topic/jurisdiction to close
        the gap.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Total questions" value={totals?.total ?? 0} />
        <Stat label="Answered" value={totals?.answered ?? 0} />
        <Stat label="Needed clarification" value={totals?.needsClarification ?? 0} />
        <Stat label="Research gaps" value={totals?.researchGap ?? 0} />
        <Stat label="Flagged" value={totals?.flagged ?? 0} />
      </div>

      <Section title={`Research gaps (${gapRows.length})`}>
        {gapRows.length === 0 ? (
          <EmptyRow text="No open research gaps." />
        ) : (
          gapRows.map((q) => <QuestionRow key={q.id} q={q} />)
        )}
      </Section>

      <Section title={`Flagged for review (${flaggedRows.length})`}>
        {flaggedRows.length === 0 ? (
          <EmptyRow text="Nothing flagged." />
        ) : (
          flaggedRows.map((q) => <QuestionRow key={q.id} q={q} />)
        )}
      </Section>

      <Section title="Recent questions">
        {recentRows.length === 0 ? <EmptyRow text="No questions asked yet." /> : recentRows.map((q) => <QuestionRow key={q.id} q={q} />)}
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border p-4">
      <p className="font-serif text-3xl text-foreground">{value}</p>
      <p className="mt-1 text-xs tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="font-serif text-lg text-foreground">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>;
}

function QuestionRow({ q }: { q: typeof askQuestions.$inferSelect }) {
  const sections = q.answerSections as { researchGapNote?: string | null } | null;
  return (
    <div className="border border-border p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-foreground">{q.question}</p>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted">{DATE_FORMAT.format(q.createdAt)}</span>
          <form action={deleteAskQuestion.bind(null, q.id)}>
            <button type="submit" className="text-xs text-red-400 hover:text-red-300" title="Delete this question">
              Delete
            </button>
          </form>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">
        {q.status}
        {q.jurisdiction ? ` · ${jurisdictionLabel(q.jurisdiction)}` : ""}
        {q.flaggedForReview ? " · flagged" : ""}
      </p>
      {sections?.researchGapNote && <p className="mt-1 text-xs text-muted">Gap: {sections.researchGapNote}</p>}
      {q.flagNote && <p className="mt-1 text-xs text-muted">Note: {q.flagNote}</p>}
    </div>
  );
}
