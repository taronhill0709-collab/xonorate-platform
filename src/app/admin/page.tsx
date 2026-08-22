import { and, count, eq, gte } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import {
  cases,
  comments,
  generalInquiries,
  inquiries,
  petitions,
  posts,
  signatures,
  users,
} from "@/db/schema";
import { listCaseNreCandidates } from "@/lib/case-nre-candidates";

async function getCounts() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    [caseCount],
    [petitionCount],
    [verifiedSignatureCount],
    [newCaseSubmissionCount],
    [newGeneralInquiryCount],
    [pendingCommentCount],
    [pendingPostCount],
    [supporterCount],
    [newSupporterCount],
  ] = await Promise.all([
    db.select({ value: count() }).from(cases),
    db.select({ value: count() }).from(petitions),
    db
      .select({ value: count() })
      .from(signatures)
      .where(eq(signatures.verified, true)),
    db
      .select({ value: count() })
      .from(inquiries)
      .where(eq(inquiries.status, "new")),
    db
      .select({ value: count() })
      .from(generalInquiries)
      .where(eq(generalInquiries.status, "new")),
    db
      .select({ value: count() })
      .from(comments)
      .where(eq(comments.status, "pending")),
    db
      .select({ value: count() })
      .from(posts)
      .where(eq(posts.status, "pending")),
    db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "supporter")),
    db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, "supporter"), gte(users.createdAt, sevenDaysAgo))),
  ]);

  return {
    cases: caseCount.value,
    petitions: petitionCount.value,
    verifiedSignatures: verifiedSignatureCount.value,
    newCaseSubmissions: newCaseSubmissionCount.value,
    newGeneralInquiries: newGeneralInquiryCount.value,
    pendingComments: pendingCommentCount.value,
    pendingPosts: pendingPostCount.value,
    supporters: supporterCount.value,
    newSupportersThisWeek: newSupporterCount.value,
  };
}

export default async function AdminDashboardPage() {
  // Sourced from Netlify Blobs, not Postgres like every other tile here —
  // staged NRE research candidates never touch the `cases` table until an
  // admin reviews and saves them (see case-nre-candidates.ts), so there's
  // no DB row to count() until then.
  const [counts, candidates] = await Promise.all([getCounts(), listCaseNreCandidates()]);

  const tiles = [
    { label: "Cases", value: counts.cases, href: "/admin/cases" },
    {
      label: "Exoneree candidates to review",
      value: candidates.length,
      href: "/admin/cases/candidates",
    },
    { label: "Petitions", value: counts.petitions, href: "/admin/petitions" },
    {
      label: "Confirmed signatures",
      value: counts.verifiedSignatures,
      href: "/admin/petitions",
    },
    { label: "Supporter accounts", value: counts.supporters, href: "/admin/supporters" },
    {
      label: "New sign-ups this week",
      value: counts.newSupportersThisWeek,
      href: "/admin/supporters",
    },
    {
      label: "New case submissions",
      value: counts.newCaseSubmissions,
      href: "/admin/case-submissions",
    },
    { label: "New inquiries", value: counts.newGeneralInquiries, href: "/admin/inquiries" },
    { label: "Comments to moderate", value: counts.pendingComments, href: "/admin/comments" },
    { label: "Roundup drafts awaiting review", value: counts.pendingPosts, href: "/admin/posts" },
  ];

  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-brand uppercase">Overview</p>
      <h1 className="mt-1 font-serif text-2xl text-foreground">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => {
          const content = (
            <>
              <p className="font-mono text-3xl font-bold text-brand tabular-nums">
                {tile.value}
              </p>
              <p className="mt-1 font-mono text-[11px] tracking-wide text-muted uppercase">
                {tile.label}
              </p>
            </>
          );
          return tile.href ? (
            <Link
              key={tile.label}
              href={tile.href}
              className="border border-border bg-muted-background p-4 transition hover:border-brand"
            >
              {content}
            </Link>
          ) : (
            <div key={tile.label} className="border border-border bg-muted-background p-4">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
