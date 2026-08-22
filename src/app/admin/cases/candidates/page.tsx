import Link from "next/link";
import { listCaseNreCandidates } from "@/lib/case-nre-candidates";
import { discardCaseCandidate } from "../actions";
import { TriggerResearchButton } from "./trigger-research-button";

export default async function CaseCandidatesPage() {
  const candidates = await listCaseNreCandidates();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Exoneree candidates</h1>
          <p className="mt-1 text-sm text-muted">
            Researched from the National Registry of Exonerations (once daily, or on demand
            below). Nothing here is public — review and save the ones worth adding, discard the
            rest.
          </p>
        </div>
        <TriggerResearchButton />
      </div>

      {candidates.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No candidates awaiting review.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">State</th>
              <th className="py-2 font-medium">Found</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-border">
                <td className="py-2 text-foreground">{c.clientName}</td>
                <td className="py-2 text-foreground">{c.state}</td>
                <td className="py-2 text-foreground">
                  {new Date(c.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="py-2 text-right">
                  <Link href={`/admin/cases/new?candidateId=${c.id}`} className="text-brand underline">
                    Review
                  </Link>{" "}
                  <form action={discardCaseCandidate.bind(null, c.id)} className="inline">
                    <button type="submit" className="text-red-400 underline">
                      Discard
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
