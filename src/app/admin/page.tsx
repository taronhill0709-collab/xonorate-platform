import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  cases,
  comments,
  inquiries,
  petitions,
  posts,
  signatures,
} from "@/db/schema";

async function getCounts() {
  const [
    [caseCount],
    [petitionCount],
    [verifiedSignatureCount],
    [newInquiryCount],
    [pendingCommentCount],
    [pendingPostCount],
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
      .from(comments)
      .where(eq(comments.status, "pending")),
    db
      .select({ value: count() })
      .from(posts)
      .where(eq(posts.status, "pending")),
  ]);

  return {
    cases: caseCount.value,
    petitions: petitionCount.value,
    verifiedSignatures: verifiedSignatureCount.value,
    newInquiries: newInquiryCount.value,
    pendingComments: pendingCommentCount.value,
    pendingPosts: pendingPostCount.value,
  };
}

export default async function AdminDashboardPage() {
  const counts = await getCounts();

  const tiles = [
    { label: "Cases", value: counts.cases },
    { label: "Petitions", value: counts.petitions },
    { label: "Confirmed signatures", value: counts.verifiedSignatures },
    { label: "New inquiries", value: counts.newInquiries, href: "/admin/inquiries" },
    { label: "Comments to moderate", value: counts.pendingComments, href: "/admin/comments" },
    { label: "Posts awaiting review", value: counts.pendingPosts, href: "/admin/posts" },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-lg border border-border bg-background p-4"
          >
            <p className="text-2xl font-semibold text-foreground">
              {tile.value}
            </p>
            <p className="text-sm text-muted">{tile.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
