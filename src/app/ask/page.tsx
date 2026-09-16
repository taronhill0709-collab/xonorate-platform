import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AskXonorateExperience } from "./ask-experience";

export const metadata: Metadata = {
  title: "Ask Xonorate",
  description:
    "Ask a wrongful-conviction research question and get a source-grounded answer drawn from Xonorate's knowledge base, curated legal and research sources, and documented cases — general information and research, not legal advice.",
};

export default async function AskXonoratePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <Eyebrow text="Research Assistant" />
            <h1 className="mt-3 font-serif text-4xl text-header-foreground sm:text-5xl">Ask Xonorate</h1>
            <p className="mt-4 max-w-2xl text-lg text-header-muted">
              Ask a question. Xonorate will help you understand the issue, examine the relevant research, and find
              the resources and documented cases that may matter — grounded in Xonorate&apos;s knowledge base and a
              curated library of legal and research sources, never invented.
            </p>
            <p className="mt-5 font-mono text-xs font-bold tracking-wide text-header-label uppercase">
              General information and research — not legal advice. Xonorate is not a law firm.
            </p>
            <p className="mt-1.5 font-mono text-xs tracking-wide text-header-muted uppercase">
              Responses typically take up to 30 seconds.
            </p>
          </div>
        </div>
        <AskXonorateExperience initialTopic={topic ?? null} />
      </main>
      <SiteFooter />
    </>
  );
}
