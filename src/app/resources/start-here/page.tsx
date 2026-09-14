import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Start Here",
  description: "New to wrongful convictions? A guided starting point for understanding the issue and finding help.",
};

const STEPS = [
  {
    number: "01",
    title: "Understand",
    body: "What is a wrongful conviction? It's a conviction of someone for a crime they did not commit — the result of identifiable, documented failures in the justice system, not random bad luck.",
    href: "/resources/browse?category=knowledge",
    cta: "Read the basics →",
  },
  {
    number: "02",
    title: "Learn",
    body: "How do wrongful convictions happen? Eyewitness misidentification, false confessions, jailhouse informants, forensic error, and official misconduct are among the most common documented causes.",
    href: "/issues",
    cta: "Explore the issues →",
  },
  {
    number: "03",
    title: "Explore",
    body: "See what a wrongful conviction actually looks like — the people affected, the evidence involved, and how their cases unfolded.",
    href: "/cases",
    cta: "Explore real Xonorate cases →",
  },
  {
    number: "04",
    title: "Research",
    body: "Understand the evidence, legal processes, and case-building tools that matter for a real wrongful-conviction claim.",
    href: "/resources/browse?category=case_resource",
    cta: "Explore case resources →",
  },
  {
    number: "05",
    title: "Act",
    body: "Find ways to help — sign a petition, share a case, or connect with an organization doing this work.",
    href: "/take-action",
    cta: "Find ways to help →",
  },
] as const;

export default function StartHerePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <Eyebrow text="New to wrongful convictions?" />
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">Start here.</h1>
            <p className="mt-2 max-w-xl text-header-muted">
              You don&apos;t have to know exactly what you&apos;re looking for. This is a simple path through what we
              know, what we&apos;ve found, and what you can do.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl px-6 py-14">
          <div className="space-y-0">
            {STEPS.map((step, i) => (
              <div key={step.number}>
                <div className="flex gap-5 py-6">
                  <p className="w-12 shrink-0 font-serif text-3xl text-brand tabular-nums">{step.number}</p>
                  <div>
                    <h2 className="font-serif text-2xl text-foreground">{step.title}</h2>
                    <p className="mt-2 text-muted">{step.body}</p>
                    <Link
                      href={step.href}
                      className="mt-3 inline-block font-mono text-xs font-bold tracking-widest text-brand uppercase hover:text-accent"
                    >
                      {step.cta}
                    </Link>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="ml-[1.625rem] h-6 w-px bg-border" aria-hidden />
                )}
              </div>
            ))}
          </div>

          <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
            Looking for something specific instead?{" "}
            <Link href="/resources" className="text-brand underline">
              Go to the full Resource Center
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
