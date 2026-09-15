"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MarkdownBody } from "@/components/markdown-body";
import type { AskAnswerResolved } from "@/lib/ask-xonorate";
import { JURISDICTIONS } from "@/lib/jurisdictions";
import { flagAskAnswer, getAskXonorateStatus, startAskXonorate } from "./actions";

const POLL_INTERVAL_MS = 2000;
// Background function has a 15-minute budget; give up well short of that
// and let the visitor retry rather than polling forever if it silently dies.
const MAX_POLL_ATTEMPTS = 150; // 150 * 2s = 5 minutes

type ViewState =
  | { phase: "idle" }
  | { phase: "pending" }
  | { phase: "error"; message: string }
  | { phase: "answered"; questionId: string; answer: AskAnswerResolved };

const EXAMPLE_QUESTIONS = [
  "What is post-conviction relief?",
  "What is the difference between an appeal and post-conviction relief?",
  "What should I look for in an eyewitness identification?",
  "What organizations investigate wrongful-conviction claims?",
];

export function AskXonorateExperience({ initialTopic }: { initialTopic?: string | null }) {
  const [question, setQuestion] = useState(initialTopic ? `I have a question about ${initialTopic}: ` : "");
  const [jurisdiction, setJurisdiction] = useState<string>("");
  const [view, setView] = useState<ViewState>({ phase: "idle" });
  const [flagged, setFlagged] = useState(false);
  const cancelledRef = useRef(false);

  async function poll(jobId: string) {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (cancelledRef.current) return;

      const result = await getAskXonorateStatus(jobId);
      if (cancelledRef.current) return;
      if (result.status === "pending") continue;

      if (result.status === "failed") {
        setView({ phase: "error", message: result.error });
        return;
      }

      setView({ phase: "answered", questionId: result.questionId, answer: result.answer });
      return;
    }
    setView({
      phase: "error",
      message: "This is taking longer than expected. Try again in a moment.",
    });
  }

  async function submit(q: string, j: string | null) {
    setFlagged(false);
    setView({ phase: "pending" });
    const started = await startAskXonorate(q, j);
    if (!started.ok) {
      setView({ phase: "error", message: started.error });
      return;
    }
    await poll(started.jobId);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    void submit(question.trim(), jurisdiction || null);
  }

  async function handleFlag(questionId: string) {
    setFlagged(true);
    await flagAskAnswer(questionId);
  }

  const isBusy = view.phase === "pending";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="Ask a wrongful-conviction research question — e.g. &quot;What is post-conviction relief?&quot;"
          className="w-full border border-border bg-background p-4 text-base text-foreground focus:border-brand focus:outline-none"
          maxLength={1500}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold tracking-widest text-label uppercase">Jurisdiction (optional)</label>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Not sure / general question</option>
            {JURISDICTIONS.map((j) => (
              <option key={j.code} value={j.code}>
                {j.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isBusy || !question.trim()}
            className="ml-auto bg-brand px-6 py-2 text-sm font-bold tracking-widest text-brand-foreground uppercase transition hover:bg-accent disabled:opacity-60"
          >
            {isBusy ? "Researching…" : "Ask →"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className="border border-border px-3 py-1 text-xs text-muted transition hover:border-brand hover:text-brand"
            >
              {q}
            </button>
          ))}
        </div>
      </form>

      {view.phase === "pending" && (
        <p className="mt-10 font-mono text-sm text-muted">
          Researching Xonorate&apos;s knowledge base and curated sources — this can take up to a minute…
        </p>
      )}

      {view.phase === "error" && <p className="mt-10 text-sm text-red-400">{view.message}</p>}

      {view.phase === "answered" && (
        <AnswerView answer={view.answer} questionId={view.questionId} flagged={flagged} onFlag={handleFlag} />
      )}
    </div>
  );
}

function AnswerView({
  answer,
  questionId,
  flagged,
  onFlag,
}: {
  answer: AskAnswerResolved;
  questionId: string;
  flagged: boolean;
  onFlag: (questionId: string) => void;
}) {
  const sections = answer;

  return (
    <div className="mt-12 border-t border-border pt-10">
      {answer.needsClarification ? (
        <div>
          <p className="text-xs font-bold tracking-widest text-label uppercase">A bit more would help</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-foreground">
            {answer.clarifyingQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Pick a jurisdiction above (or add the detail to your question) and ask again.
          </p>
        </div>
      ) : (
        <>
          {answer.shortAnswer && (
            <div>
              <p className="text-xs font-bold tracking-widest text-label uppercase">Short answer</p>
              <p className="mt-3 text-xl leading-relaxed text-foreground">{answer.shortAnswer}</p>
            </div>
          )}

          {sections?.whatLawSays && (
            <Section title="What the law generally says">
              <MarkdownBody>{sections.whatLawSays}</MarkdownBody>
            </Section>
          )}

          {sections?.relevantFactors && (
            <Section title="What may be relevant to your situation">
              <MarkdownBody>{sections.relevantFactors}</MarkdownBody>
            </Section>
          )}

          {sections && sections.questionsToInvestigate.length > 0 && (
            <Section title="Questions worth investigating">
              <ul className="mt-3 list-disc space-y-2 pl-5 text-foreground">
                {sections.questionsToInvestigate.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </Section>
          )}

          {answer.citedSources.length > 0 && (
            <Section title="Research & authority cited">
              <div className="mt-3 space-y-3">
                {answer.citedSources.map((s) => (
                  <div key={s.id} className="border border-border p-4">
                    <p className="font-serif text-lg text-foreground">{s.title}</p>
                    {s.citation && <p className="mt-1 text-sm text-muted">{s.citation}</p>}
                    {s.organization && <p className="text-sm text-muted">{s.organization}</p>}
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-brand">
                        View source ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {answer.relatedResources.length > 0 && (
            <Section title="Related Xonorate resources">
              <div className="mt-3 space-y-2">
                {answer.relatedResources.map((r) => (
                  <Link key={r.id} href={`/resources/${r.slug}`} className="block border border-border p-3 transition hover:border-brand">
                    <p className="font-serif text-lg text-foreground">{r.title}</p>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {answer.relatedCases.length > 0 && (
            <Section title="Related Xonorate cases">
              <div className="mt-3 space-y-2">
                {answer.relatedCases.map((c) => (
                  <Link key={c.id} href={`/cases/${c.slug}`} className="block border border-border p-3 transition hover:border-brand">
                    <p className="font-serif text-lg text-foreground">{c.title}</p>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {answer.relatedInvestigations.length > 0 && (
            <Section title="Related Xonorate investigations">
              <div className="mt-3 space-y-2">
                {answer.relatedInvestigations.map((i) => (
                  <Link key={i.id} href={`/investigations/${i.slug}`} className="block border border-border p-3 transition hover:border-brand">
                    <p className="font-serif text-lg text-foreground">{i.title}</p>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {sections && sections.questionsForCounsel.length > 0 && (
            <Section title="Questions you may want to ask qualified counsel">
              <ul className="mt-3 list-disc space-y-2 pl-5 text-foreground">
                {sections.questionsForCounsel.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </Section>
          )}

          {answer.researchGap && sections?.researchGapNote && (
            <Section title="Research gap">
              <p className="mt-3 text-sm text-muted">
                {sections.researchGapNote} This has been logged so Xonorate&apos;s research team can add it to the
                curated source library.
              </p>
            </Section>
          )}
        </>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <p className="font-mono text-xs text-muted">
          This is general legal and research information, not legal advice, and Xonorate is not a law firm and does
          not represent you. Discuss your specific situation with a qualified attorney.
        </p>
        <button
          type="button"
          disabled={flagged}
          onClick={() => onFlag(questionId)}
          className="mt-3 text-xs text-muted underline transition hover:text-brand disabled:no-underline disabled:opacity-60"
        >
          {flagged ? "Thanks — flagged for editorial review." : "Report a problem with this answer"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <p className="text-xs font-bold tracking-widest text-label uppercase">{title}</p>
      {children}
    </div>
  );
}
