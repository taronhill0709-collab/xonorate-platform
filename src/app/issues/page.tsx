import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { ISSUES } from "@/lib/issues";

export const metadata: Metadata = {
  title: "The Issues",
  description:
    "The documented causes of wrongful conviction — eyewitness misidentification, false confessions, jailhouse informants, forensic error, official misconduct, ineffective counsel, and false accusation.",
};

export const dynamic = "force-dynamic";

export default async function IssuesIndexPage() {
  const rows = await db
    .select({ contributingFactorTags: cases.contributingFactorTags })
    .from(cases);

  const caseCountByTag = new Map<string, number>();
  for (const row of rows) {
    const tags = (row.contributingFactorTags as string[] | null) ?? [];
    for (const tag of tags) {
      caseCountByTag.set(tag, (caseCountByTag.get(tag) ?? 0) + 1);
    }
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 bg-background">
        <div className="border-b border-header-border bg-header-background">
          <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <Eyebrow text="The issues" />
            <h1 className="mt-2 font-serif text-3xl text-header-foreground sm:text-5xl">
              Why wrongful convictions happen
            </h1>
            <p className="mt-2 max-w-xl text-header-muted">
              The system doesn&apos;t fail at random. These are the
              documented causes, case after case — and the ones behind our
              own clients&apos; convictions.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-header-border bg-header-border sm:grid-cols-2 lg:grid-cols-3">
            {ISSUES.map((issue) => {
              const relatedCount = caseCountByTag.get(issue.tag) ?? 0;
              return (
                <Link
                  key={issue.slug}
                  href={`/issues/${issue.slug}`}
                  className="flex flex-col gap-3 bg-background p-6 transition hover:bg-muted-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-serif text-xl text-foreground">{issue.title}</h2>
                    {issue.stat && (
                      <span className="shrink-0 font-serif text-2xl text-brand tabular-nums">
                        {issue.stat.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{issue.dek}</p>
                  {relatedCount > 0 && (
                    <p className="mt-auto text-xs font-bold tracking-wide text-brand uppercase">
                      {relatedCount} Xonorate case{relatedCount === 1 ? "" : "s"} →
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
